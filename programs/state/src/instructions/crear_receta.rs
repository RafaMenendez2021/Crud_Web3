use anchor_lang::prelude::*;
use crate::state::*;

pub fn handler_crear_receta(
    ctx: Context<CrearReceta>,
    nombre_pan: String,
    precio_venta: u64,
    piezas: u8,
    ingredientes: Vec<Ingrediente>,
) -> Result<()> {
    let receta = &mut ctx.accounts.receta;
    let gestor = &mut ctx.accounts.gestor;

    // Calculamos el costo total del pan sumando lo que cuesta cada ingrediente.
    let mut costo_total: u64 = 0;
    for ing in ingredientes.iter() {
        // Multiplicamos la cantidad usada por su costo individual.
        let costo_ingrediente = (ing.cantidad as u64).checked_mul(ing.costo_unitario).unwrap();
        // Sumamos este resultado al costo total acumulado.
        costo_total = costo_total.checked_add(costo_ingrediente).unwrap();
    }

    // Guardamos toda la informacion en la nueva ficha de la receta.
    receta.gestor = gestor.key();
    receta.id = gestor.total_recetas;
    receta.nombre_pan = nombre_pan;
    receta.costo_produccion = costo_total; 
    receta.precio_venta = precio_venta;
    receta.piezas = piezas;
    
    // Al crear la receta, aun no hay panes hechos, el inventario es cero.
    receta.inventario_disponible = 0;
    // Marcamos la receta como disponible para ser usada.
    receta.activo = true;
    receta.ingredientes = ingredientes;

    // Aumentamos el contador de recetas totales del negocio.
    gestor.total_recetas = gestor.total_recetas.checked_add(1).unwrap();
    Ok(())
}

#[derive(Accounts)]
pub struct CrearReceta<'info> {
    #[account(mut, has_one = autoridad)]
    pub gestor: Account<'info, Gestor>,
    #[account(
        init,
        payer = autoridad,
        // Reservamos espacio suficiente para que quepan varios ingredientes.
        space = 8 + 1024, 
        seeds = [b"receta", gestor.key().as_ref(), &gestor.total_recetas.to_le_bytes()],
        bump
    )]
    pub receta: Account<'info, Receta>,
    #[account(mut)]
    pub autoridad: Signer<'info>,
    pub system_program: Program<'info, System>,
}
