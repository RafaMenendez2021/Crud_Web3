use anchor_lang::prelude::*;

pub mod state;
pub mod instructions;

use instructions::*;

declare_id!("G2meTE2hu5K9dEKTiKakETMJP393KisRch4nguFCHVa");

#[program]
pub mod panaderia_pda {
    use super::*;

    // Abre la panaderia por primera vez y deja todo en ceros.
    pub fn inicializar_gestor(ctx: Context<InicializarGestor>) -> Result<()> {
        handler_inicializar_gestor(ctx)
    }

    // Registra un nuevo pan en el catalogo con sus ingredientes y precio.
    pub fn crear_receta(
        ctx: Context<CrearReceta>,
        nombre_pan: String,
        precio_venta: u64,
        piezas: u8,
        ingredientes: Vec<Ingrediente>,
    ) -> Result<()> {
        handler_crear_receta(ctx, nombre_pan, precio_venta, piezas, ingredientes)
    }

    // Aumenta el pan disponible en la vitrina preparandolo.
    pub fn hornear_pan(ctx: Context<HornearPan>, lotes: u8) -> Result<()> {
        handler_hornear_pan(ctx, lotes)
    }

    // Procesa una venta, cobra al cliente y entrega el recibo.
    pub fn registrar_ticket(
        ctx: Context<RegistrarTicket>,
        nombre_cliente: String,
        cantidad_vendida: u8,
        pago_fiat: bool,
    ) -> Result<()> {
        handler_registrar_ticket(ctx, nombre_cliente, cantidad_vendida, pago_fiat)
    }

    // Permite cambiar los precios o ingredientes si la situacion economica cambia.
    pub fn actualizar_receta(
        ctx: Context<ActualizarReceta>,
        nuevo_precio_venta: u64,
        nuevos_ingredientes: Vec<Ingrediente>, 
    ) -> Result<()> {
        handler_actualizar_receta(ctx, nuevo_precio_venta, nuevos_ingredientes)
    }

    // Descontinua un pan para que ya no se pueda vender ni preparar.
    pub fn borrar_receta(ctx: Context<BorrarReceta>) -> Result<()> {
        handler_borrar_receta(ctx)
    }
}
