use anchor_lang::prelude::*;
use crate::state::*;

pub fn handler_crear_receta(
    ctx: Context<CrearReceta>,
    nombre_pan: String,
    costo_produccion: u64,
    precio_venta: u64,
    piezas: u8,
) -> Result<()> {
    let receta = &mut ctx.accounts.receta;
    let gestor = &mut ctx.accounts.gestor;

    receta.gestor = gestor.key();
    receta.id = gestor.total_recetas;
    receta.nombre_pan = nombre_pan;
    receta.costo_produccion = costo_produccion;
    receta.precio_venta = precio_venta;
    receta.piezas = piezas;
    receta.inventario_disponible = 0;

    gestor.total_recetas = gestor.total_recetas.checked_add(1).unwrap();
    Ok(())
}

#[derive(Accounts)]
#[instruction(nombre_pan: String)]
pub struct CrearReceta<'info> {
    #[account(mut, has_one = autoridad)]
    pub gestor: Account<'info, Gestor>,
    #[account(
        init,
        payer = autoridad,
        space = 8 + 32 + 8 + 36 + 8 + 8 + 1 + 4,
        seeds = [b"receta", gestor.key().as_ref(), &gestor.total_recetas.to_le_bytes()],
        bump
    )]
    pub receta: Account<'info, Receta>,
    #[account(mut)]
    pub autoridad: Signer<'info>,
    pub system_program: Program<'info, System>,
}