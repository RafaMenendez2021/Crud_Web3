use anchor_lang::prelude::*;
use crate::state::*;

pub fn handler_registrar_ticket(
    ctx: Context<RegistrarTicket>,
    nombre_cliente: String,
    cantidad_vendida: u8,
    ganancia_calculada: u64,
) -> Result<()> {
    let ticket = &mut ctx.accounts.ticket;
    let gestor = &mut ctx.accounts.gestor;
    let receta = &mut ctx.accounts.receta;

    require!(receta.inventario_disponible >= cantidad_vendida as u32, PanaderiaError::InventarioInsuficiente);

    receta.inventario_disponible = receta.inventario_disponible.checked_sub(cantidad_vendida as u32).unwrap();

    ticket.id = gestor.total_tickets;
    ticket.comprador = ctx.accounts.comprador.key();
    ticket.nombre_cliente = nombre_cliente;
    ticket.receta_id = receta.id;
    ticket.cantidad = cantidad_vendida;
    ticket.ganancia = ganancia_calculada;

    gestor.total_tickets = gestor.total_tickets.checked_add(1).unwrap();
    Ok(())
}

#[derive(Accounts)]
#[instruction(nombre_cliente: String)]
pub struct RegistrarTicket<'info> {
    #[account(mut)]
    pub gestor: Account<'info, Gestor>,
    #[account(mut)]
    pub receta: Account<'info, Receta>,
    #[account(
        init,
        payer = comprador,
        space = 8 + 8 + 32 + 36 + 8 + 1 + 8,
        seeds = [b"ticket", gestor.key().as_ref(), &gestor.total_tickets.to_le_bytes()],
        bump
    )]
    pub ticket: Account<'info, Ticket>,
    #[account(mut)]
    pub comprador: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum PanaderiaError {
    #[msg("Error: No hay suficiente pan en el inventario para esta venta.")]
    InventarioInsuficiente,
}