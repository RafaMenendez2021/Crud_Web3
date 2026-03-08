use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::*;

pub fn handler_registrar_ticket(
    ctx: Context<RegistrarTicket>,
    nombre_cliente: String,
    cantidad_vendida: u8,
    pago_fiat: bool,
) -> Result<()> {
    let ticket = &mut ctx.accounts.ticket;
    let gestor = &mut ctx.accounts.gestor;
    let receta = &mut ctx.accounts.receta;

    // Verificaciones antes de vender: el pan debe existir y debe haber suficiente en vitrina.
    require!(receta.activo, PanaderiaError::RecetaInactiva);
    require!(receta.inventario_disponible >= cantidad_vendida as u32, PanaderiaError::InventarioInsuficiente);

    // Calculamos cuanto debe pagar el cliente y cuanta ganancia limpia nos deja.
    let total_a_pagar = (receta.precio_venta).checked_mul(cantidad_vendida as u64).unwrap();
    let ganancia_unitaria = receta.precio_venta.checked_sub(receta.costo_produccion).unwrap();
    let ganancia_total = ganancia_unitaria.checked_mul(cantidad_vendida as u64).unwrap();

    // Si el cliente no pago en efectivo, le cobramos automaticamente en cripto.
    if !pago_fiat {
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.comprador.to_account_info(),
                to: ctx.accounts.autoridad.to_account_info(),
            },
        );
        system_program::transfer(cpi_context, total_a_pagar)?;
        
        // Sumamos este dinero a la caja fuerte del negocio.
        gestor.ingresos_totales = gestor.ingresos_totales.checked_add(total_a_pagar).unwrap();
    }

    // Quitamos los panes que se llevo el cliente del inventario.
    receta.inventario_disponible = receta.inventario_disponible.checked_sub(cantidad_vendida as u32).unwrap();

    // Llenamos el recibo con todos los datos de la compra.
    ticket.id = gestor.total_tickets;
    ticket.comprador = ctx.accounts.comprador.key();
    ticket.nombre_cliente = nombre_cliente;
    ticket.receta_id = receta.id;
    ticket.cantidad = cantidad_vendida;
    ticket.ganancia = ganancia_total;
    ticket.pago_fiat = pago_fiat;

    // Aumentamos el contador de ventas historicas del negocio.
    gestor.total_tickets = gestor.total_tickets.checked_add(1).unwrap();
    Ok(())
}

#[derive(Accounts)]
#[instruction(nombre_cliente: String)]
pub struct RegistrarTicket<'info> {
    #[account(mut, has_one = autoridad)]
    pub gestor: Account<'info, Gestor>,
    #[account(mut)]
    pub receta: Account<'info, Receta>,
    #[account(
        init,
        payer = comprador,
        space = 8 + 8 + 32 + 36 + 8 + 1 + 8 + 1,
        seeds = [b"ticket", gestor.key().as_ref(), &gestor.total_tickets.to_le_bytes()],
        bump
    )]
    pub ticket: Account<'info, Ticket>,
    #[account(mut)]
    pub comprador: Signer<'info>,
    // Esta cuenta es vital porque indica hacia donde se transfiere el pago en cripto.
    /// CHECK: Recibe los fondos, protegida por has_one = autoridad en gestor.
    #[account(mut)]
    pub autoridad: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}
