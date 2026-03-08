use anchor_lang::prelude::*;
use crate::state::*;

pub fn handler_inicializar_gestor(ctx: Context<InicializarGestor>) -> Result<()> {
    let gestor = &mut ctx.accounts.gestor;
    gestor.autoridad = ctx.accounts.autoridad.key();
    gestor.total_recetas = 0;
    gestor.total_tickets = 0;
    Ok(())
}

#[derive(Accounts)]
pub struct InicializarGestor<'info> {
    #[account(
        init,
        payer = autoridad,
        space = 8 + 32 + 8 + 8,
        seeds = [b"gestor", autoridad.key().as_ref()],
        bump
    )]
    pub gestor: Account<'info, Gestor>,
    #[account(mut)]
    pub autoridad: Signer<'info>,
    pub system_program: Program<'info, System>,
}