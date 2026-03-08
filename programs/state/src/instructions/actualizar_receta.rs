use anchor_lang::prelude::*;
use crate::state::*;

pub fn handler_actualizar_receta(
    ctx: Context<ActualizarReceta>,
    nuevo_costo_produccion: u64,
    nuevo_precio_venta: u64,
) -> Result<()> {
    let receta = &mut ctx.accounts.receta;

    receta.costo_produccion = nuevo_costo_produccion;
    receta.precio_venta = nuevo_precio_venta;

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
