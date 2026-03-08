use anchor_lang::prelude::*;
use crate::state::*;

pub fn handler_actualizar_receta(
    ctx: Context<ActualizarReceta>,
    nuevo_precio_venta: u64,
    nuevos_ingredientes: Vec<Ingrediente>,
) -> Result<()> {
    let receta = &mut ctx.accounts.receta;

    // Recalcular el costo con los nuevos precios/cantidades
    let mut costo_total: u64 = 0;
    for ing in nuevos_ingredientes.iter() {
        let costo_ingrediente = (ing.cantidad as u64).checked_mul(ing.costo_unitario).unwrap();
        costo_total = costo_total.checked_add(costo_ingrediente).unwrap();
    }

    receta.precio_venta = nuevo_precio_venta;
    receta.costo_produccion = costo_total;
    receta.ingredientes = nuevos_ingredientes;

    Ok(())
}

#[derive(Accounts)]
pub struct ActualizarReceta<'info> {
    #[account(mut, has_one = autoridad)]
    pub gestor: Account<'info, Gestor>,
    #[account(
        mut,
        seeds = [b"receta", gestor.key().as_ref(), &receta.id.to_le_bytes()],
        bump
    )]
    pub receta: Account<'info, Receta>,
    pub autoridad: Signer<'info>,
}
