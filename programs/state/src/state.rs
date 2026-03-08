use anchor_lang::prelude::*;

#[account]
pub struct Gestor {
    pub autoridad: Pubkey,
    pub total_recetas: u64,
    pub total_tickets: u64,
    pub ingresos_totales: u64,
}

// ¡NUEVO! Estructura dinámica para los ingredientes
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct Ingrediente {
    pub nombre: String,
    pub cantidad: u32,      // gramos, mililitros o piezas
    pub costo_unitario: u64, // en centavos (o lamports)
}

#[account]
pub struct Receta {
    pub gestor: Pubkey,
    pub id: u64,
    pub nombre_pan: String,
    pub costo_produccion: u64, // Ahora se calcula automáticamente
    pub precio_venta: u64,
    pub piezas: u8,
    pub inventario_disponible: u32,
    pub activo: bool,
    pub ingredientes: Vec<Ingrediente>, // ¡NUEVO! Lista de ingredientes
}

#[account]
pub struct Ticket {
    pub id: u64,
    pub comprador: Pubkey,
    pub nombre_cliente: String,
    pub receta_id: u64,
    pub cantidad: u8,
    pub ganancia: u64,
    pub pago_fiat: bool,
}

#[error_code]
pub enum PanaderiaError {
    #[msg("Error: No hay suficiente pan en el inventario para esta venta.")]
    InventarioInsuficiente,
    #[msg("Error: Esta receta está inactiva y no puede usarse.")]
    RecetaInactiva,
}
