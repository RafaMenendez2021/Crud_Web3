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

    // 🧮 CALCULAR EL COSTO DE PRODUCCIÓN AUTOMÁTICAMENTE
    let mut costo_total: u64 = 0;
    for ing in ingredientes.iter() {
        let costo_ingrediente = (ing.cantidad as u64).checked_mul(ing.costo_unitario).unwrap();
        costo_total = costo_total.checked_add(costo_ingrediente).unwrap();
    }

    receta.gestor = gestor.key();
    receta.id = gestor.total_recetas;
    receta.nombre_pan = nombre_pan;
    receta.costo_produccion = costo_total; // Asignamos el resultado
    receta.precio_venta = precio_venta;
    receta.piezas = piezas;
    receta.inventario_disponible = 0;
    receta.activo = true;
    receta.ingredientes = ingredientes;

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
        space = 8 + 1024, // Damos 1024 bytes (suficiente para muchos ingredientes)
        seeds = [b"receta", gestor.key().as_ref(), &gestor.total_recetas.to_le_bytes()],
        bump
    )]
    pub receta: Account<'info, Receta>,
    #[account(mut)]
    pub autoridad: Signer<'info>,
    pub system_program: Program<'info, System>,
}
