import * as anchor from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";

describe("panaderia_pda", () => {
  const program = pg.program;
  const wallet = pg.wallet;
  let gestorPda: anchor.web3.PublicKey;

  before(async () => {
    // Calculamos la direccion unica de la panaderia basandonos en el dueño
    [gestorPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("gestor"), wallet.publicKey.toBuffer()],
      program.programId
    );
  });

  it("1. Inicializa el Gestor", async () => {
    try {
      const accountInfo = await program.provider.connection.getAccountInfo(gestorPda);
      // Si la panaderia ya existe, no hacemos nada para evitar errores
      if (accountInfo) return;

      await program.methods
        .inicializarGestor()
        .accounts({
          gestor: gestorPda,
          autoridad: wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
    } catch (error) { console.error(error); }
  });

  it("2. Crea una Receta Real (Conchas de Vainilla)", async () => {
    const gestorAccount = await program.account.gestor.fetch(gestorPda);
    const [recetaPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("receta"), gestorPda.toBuffer(), gestorAccount.totalRecetas.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    // Estandarizacion de medidas a centavos para no perder precision:
    // Huevo: 45 pesos el kg (15 piezas). 4500 centavos / 15 = 300 centavos por pieza.
    // Harina: 20 pesos el kg (1000g). 2000 centavos / 1000 = 2 centavos por gramo.
    // Azucar: 30 pesos el kg (1000g). 3000 centavos / 1000 = 3 centavos por gramo.
    
    const ingredientes = [
      { nombre: "Harina (gramos)", cantidad: 500, costoUnitario: new BN(2) },  // Costo: 10 pesos
      { nombre: "Huevo (piezas)", cantidad: 3, costoUnitario: new BN(300) },   // Costo: 9 pesos
      { nombre: "Azucar (gramos)", cantidad: 100, costoUnitario: new BN(3) }   // Costo: 3 pesos
    ]; 
    // Al final, el sistema deberia calcular automaticamente 22 pesos en total.
    
    // El pan se vendera a 10 pesos cada uno.
    const precioVenta = new BN(1000); 
    // Con esta receta obtenemos 10 conchas.
    const piezasRendimiento = 10;     

    await program.methods
      .crearReceta("Concha de Vainilla", precioVenta, piezasRendimiento, ingredientes)
      .accounts({ gestor: gestorPda, receta: recetaPda, autoridad: wallet.publicKey, systemProgram: anchor.web3.SystemProgram.programId })
      .rpc();

    const recetaCreada = await program.account.receta.fetch(recetaPda);
    console.log(`Receta creada: ${recetaCreada.nombrePan}`);
    console.log(`Costo total calculado por el contrato: $${recetaCreada.costoProduccion.toNumber() / 100} MXN`);
  });

  it("3. Actualizar Info de la Receta por Inflacion", async () => {
    const gestorAccount = await program.account.gestor.fetch(gestorPda);
    const ultimoId = gestorAccount.totalRecetas.subn(1);
    const [recetaPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("receta"), gestorPda.toBuffer(), ultimoId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    // Simulamos que el precio del huevo subio a 60 pesos el kilo (4 pesos la pieza)
    const nuevosIngredientes = [
      { nombre: "Harina (gramos)", cantidad: 500, costoUnitario: new BN(2) },
      { nombre: "Huevo (piezas)", cantidad: 3, costoUnitario: new BN(400) }, 
      { nombre: "Azucar (gramos)", cantidad: 100, costoUnitario: new BN(3) } 
    ];
    // Ajustamos el precio de venta a 12 pesos para compensar.
    const nuevoPrecioVenta = new BN(1200); 

    await program.methods
      .actualizarReceta(nuevoPrecioVenta, nuevosIngredientes)
      .accounts({ gestor: gestorPda, receta: recetaPda, autoridad: wallet.publicKey })
      .rpc();

    const recetaActualizada = await program.account.receta.fetch(recetaPda);
    console.log(`El huevo subio. Nuevo costo de produccion: $${recetaActualizada.costoProduccion.toNumber() / 100} MXN`);
  });

  it("4. Hornea y Vende el producto", async () => {
    const gestorAccount = await program.account.gestor.fetch(gestorPda);
    const ultimoId = gestorAccount.totalRecetas.subn(1);
    const [recetaPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("receta"), gestorPda.toBuffer(), ultimoId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const [ticketPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("ticket"), gestorPda.toBuffer(), gestorAccount.totalTickets.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    // Mandamos a hornear un lote para tener inventario disponible.
    await program.methods.hornearPan(1).accounts({ gestor: gestorPda, receta: recetaPda, autoridad: wallet.publicKey }).rpc();

    // Registramos la venta de la mitad del lote pagando en la caja registradora fisica (fiat).
    await program.methods.registrarTicket("Cliente Local", 5, true)
      .accounts({
        gestor: gestorPda, receta: recetaPda, ticket: ticketPda,
        comprador: wallet.publicKey, autoridad: wallet.publicKey, systemProgram: anchor.web3.SystemProgram.programId,
      }).rpc();
      
    const ticket = await program.account.ticket.fetch(ticketPda);
    console.log(`Ticket creado con exito. Ganancia neta de la venta: $${ticket.ganancia.toNumber() / 100} MXN`);
  });
});
