use anchor_lang::prelude::*;

pub mod state;
pub mod instructions;

use instructions::*;

declare_id!("G2meTE2hu5K9dEKTiKakETMJP393KisRch4nguFCHVa");

#[program]
pub mod panaderia_pda {
    use super::*;

    pub fn inicializar_gestor(ctx: Context<InicializarGestor>) -> Result<()> {
        handler_inicializar_gestor(ctx)
    }

    pub fn crear_receta(
        ctx: Context<CrearReceta>,
        nombre_pan: String,
        costo_produccion: u64,
        precio_venta: u64,
        piezas: u8,
    ) -> Result<()> {
        handler_crear_receta(ctx, nombre_pan, costo_produccion, precio_venta, piezas)
    }

    pub fn hornear_pan(ctx: Context<HornearPan>, lotes: u8) -> Result<()> {
        handler_hornear_pan(ctx, lotes)
    }

    pub fn registrar_ticket(
        ctx: Context<RegistrarTicket>,
        nombre_cliente: String,
        cantidad_vendida: u8,
        pago_fiat: bool,
    ) -> Result<()> {
        handler_registrar_ticket(ctx, nombre_cliente, cantidad_vendida, pago_fiat)
    }

    pub fn actualizar_receta(
        ctx: Context<ActualizarReceta>,
        nuevo_costo_produccion: u64,
        nuevo_precio_venta: u64,
    ) -> Result<()> {
        handler_actualizar_receta(ctx, nuevo_costo_produccion, nuevo_precio_venta)
    }

    pub fn borrar_receta(ctx: Context<BorrarReceta>) -> Result<()> {
        handler_borrar_receta(ctx)
    }
}
