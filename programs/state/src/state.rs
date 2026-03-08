use anchor_lang::prelude::*;

// El Gestor representa la panaderia en si. Es el libro mayor del negocio.
// Solo existe uno por dueño y lleva la contabilidad general.
#[account]
pub struct Gestor {
    // La direccion de la billetera del dueño de la panaderia.
    pub autoridad: Pubkey,
    // Un contador para saber cuantos tipos de pan se han inventado.
    pub total_recetas: u64,
    // Un contador para saber cuantas ventas se han realizado en la historia.
    pub total_tickets: u64,
    // El dinero total (en criptomoneda) que ha entrado a la tienda.
    pub ingresos_totales: u64,
}

// Representa un ingrediente individual dentro de una receta.
// Al agregar esto, podemos calcular cuanto cuesta hacer el pan dinamicamente.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct Ingrediente {
    // Que es (Ej. Harina, Huevo).
    pub nombre: String,
    // Cuanto se usa (en gramos o piezas).
    pub cantidad: u32,      
    // Cuanto cuesta cada unidad de este ingrediente (en centavos para evitar decimales).
    pub costo_unitario: u64, 
}

// Representa la ficha tecnica de un tipo de pan.
#[account]
pub struct Receta {
    // A que panaderia (Gestor) pertenece esta receta.
    pub gestor: Pubkey,
    // El numero de identificacion unico de esta receta.
    pub id: u64,
    // El nombre del producto al publico (Ej. Bolillo, Concha).
    pub nombre_pan: String,
    // Lo que cuesta prepararlo. El sistema lo calcula sumando los ingredientes.
    pub costo_produccion: u64, 
    // En cuanto se le vende al publico.
    pub precio_venta: u64,
    // Cuantos panes salen cada vez que se mete una charola al horno.
    pub piezas: u8,
    // Panes que estan listos en la vitrina para venderse.
    pub inventario_disponible: u32,
    // Un interruptor. Si es falso, el pan ya no se prepara ni se vende.
    pub activo: bool,
    // La lista de ingredientes que lleva este pan.
    pub ingredientes: Vec<Ingrediente>, 
}

// Es el recibo que se genera cada vez que un cliente compra.
#[account]
pub struct Ticket {
    // El numero de folio del recibo.
    pub id: u64,
    // La billetera de la persona que lo compro.
    pub comprador: Pubkey,
    // El nombre del cliente para el registro.
    pub nombre_cliente: String,
    // Que tipo de pan compro (referencia a la receta).
    pub receta_id: u64,
    // Cuantos panes se llevo.
    pub cantidad: u8,
    // El dinero limpio que gano la panaderia en esta venta (precio de venta - costo).
    pub ganancia: u64,
    // Verdadero si el cliente pago en efectivo/tarjeta fuera del sistema. Falso si pago con cripto.
    pub pago_fiat: bool,
}

// Una lista de problemas comunes que el sistema debe avisar si ocurren.
#[error_code]
pub enum PanaderiaError {
    #[msg("Error: No hay suficiente pan en el inventario para esta venta.")]
    InventarioInsuficiente,
    #[msg("Error: Esta receta esta inactiva y no puede usarse.")]
    RecetaInactiva,
}
