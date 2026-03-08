use anchor_lang::prelude::*;

#[account]
pub struct Gestor {
    pub autoridad: Pubkey,
    pub total_recetas: u64,
    pub total_tickets: u64,
}

#[account]
pub struct Receta {
    pub gestor: Pubkey,
    pub id: u64,
    pub nombre_pan: String,
    pub costo_produccion: u64,
    pub precio_venta: u64,
    pub piezas: u8,
    pub inventario_disponible: u32,
}

#[account]
pub struct Ticket {
    pub id: u64,
    pub comprador: Pubkey,
    pub nombre_cliente: String,
    pub receta_id: u64,
    pub cantidad: u8,
    pub ganancia: u64,
}
