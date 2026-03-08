use anchor_lang::prelude::*;
use crate::state::*;

pub fn handler_hornear_pan(
    ctx: Context<HornearPan>,
    lotes: u8,
) -> Result<()> {
    let receta = &mut ctx.accounts.receta;
    
    require!(receta.activo, PanaderiaError::RecetaInactiva);
    
    let piezas_horneadas = (receta.piezas as u32).checked_mul(lotes as u32).unwrap();
    receta.inventario_disponible = receta.inventario_disponible.checked_add(piezas_horneadas).unwrap();

    Ok(())
}

#[derive(Accounts)]
pub struct HornearPan<'info> {
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
