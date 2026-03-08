use anchor_lang::prelude::*;
use crate::state::*;

pub fn handler_borrar_receta(_ctx: Context<BorrarReceta>) -> Result<()> {
    let receta = &mut _ctx.accounts.receta;
    
    // En lugar de destruir los datos por completo, solo apagamos la receta.
    // Asi el historial de ventas pasadas sigue teniendo sentido.
    receta.activo = false;
    
    Ok(())
}

#[derive(Accounts)]
pub struct BorrarReceta<'info> {
    #[account(mut, has_one = autoridad)]
    pub gestor: Account<'info, Gestor>,
    #[account(
        mut,
        seeds = [b"receta", gestor.key().as_ref(), &receta.id.to_le_bytes()],
        bump
    )]
    pub receta: Account<'info, Receta>,
    #[account(mut)]
    pub autoridad: Signer<'info>,
}
