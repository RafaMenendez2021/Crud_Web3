import * as anchor from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";

describe("panaderia_pda", () => {
  const program = pg.program;
  const wallet = pg.wallet;
  let gestorPda: anchor.web3.PublicKey;

  before(async () => {
    [gestorPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("gestor"), wallet.publicKey.toBuffer()],
      program.programId
    );
  });

  it("1. Inicializa el Gestor", async () => {
    try {
      const accountInfo = await program.provider.connection.getAccountInfo(gestorPda);
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

    // --- CÁLCULOS DEL NEGOCIO (TODO EN CENTAVOS PARA EVITAR DECIMALES) ---
    // 1. Huevo: $45 el kg (15 piezas). $45.00 = 4500 centavos. 4500 / 15 = 300 centavos/pieza.
    // 2. Harina: $20 el kg (1000g). $20.00 = 2000 centavos. 2000 / 1000 = 2 centavos/gramo.
    // 3. Azúcar: $30 el kg (1000g). $30.00 = 3000 centavos. 3000 / 1000 = 3 centavos/gramo.
    
    const ingredientes = [
      { nombre: "Harina (gramos)", cantidad: 500, costoUnitario: new BN(2) },  // Costo: $10.00
      { nombre: "Huevo (piezas)", cantidad: 3, costoUnitario: new BN(300) },   // Costo: $9.00
      { nombre: "Azucar (gramos)", cantidad: 100, costoUnitario: new BN(3) }   // Costo: $3.00
    ]; 
    // Costo Total Automático esperado = $22.00 MXN (2200 centavos) para el lote.
    
    const precioVenta = new BN(1000); // Se venderá a $10.00 c/u (1000 centavos)
    const piezasRendimiento = 10;     // Salen 10 conchas con esta masa

    await program.methods
      .crearReceta("Concha de Vainilla", precioVenta, piezasRendimiento, ingredientes)
      .accounts({ gestor: gestorPda, receta: recetaPda, autoridad: wallet.publicKey, systemProgram: anchor.web3.SystemProgram.programId })
      .rpc();

    // Verificamos si el contrato inteligente sumó bien:
    const recetaCreada = await program.account.receta.fetch(recetaPda);
    console.log(`\n🥖 Receta creada: ${recetaCreada.nombrePan}`);
    console.log(`💵 Costo Total calculado por el contrato: $${recetaCreada.costoProduccion.toNumber() / 100} MXN`);
  });

  it("3. Actualizar Info/Precios de la Receta (¡Inflación!)", async () => {
    const gestorAccount = await program.account.gestor.fetch(gestorPda);
    const ultimoId = gestorAccount.totalRecetas.subn(1);
    const [recetaPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("receta"), gestorPda.toBuffer(), ultimoId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    // OH NO, el huevo subió a $60 el Kg (6000 centavos / 15 = 400 centavos la pieza)
    const nuevosIngredientes = [
      { nombre: "Harina (gramos)", cantidad: 500, costoUnitario: new BN(2) },
      { nombre: "Huevo (piezas)", cantidad: 3, costoUnitario: new BN(400) }, // <-- PRECIO NUEVO ($4.00)
      { nombre: "Azucar (gramos)", cantidad: 100, costoUnitario: new BN(3) } 
    ];
    const nuevoPrecioVenta = new BN(1200); // Subimos el pan a $12.00

    await program.methods
      .actualizarReceta(nuevoPrecioVenta, nuevosIngredientes)
      .accounts({ gestor: gestorPda, receta: recetaPda, autoridad: wallet.publicKey })
      .rpc();

    const recetaActualizada = await program.account.receta.fetch(recetaPda);
    console.log(`📈 Huevo subió! Nuevo costo producción: $${recetaActualizada.costoProduccion.toNumber() / 100} MXN`);
  });

  it("4. Hornea y Vende (Flujo normal)", async () => {
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

    // Horneamos 1 lote (10 piezas)
    await program.methods.hornearPan(1).accounts({ gestor: gestorPda, receta: recetaPda, autoridad: wallet.publicKey }).rpc();

    // Vendemos 5 piezas pagando en fiat (efectivo/caja)
    await program.methods.registrarTicket("Cliente Local", 5, true)
      .accounts({
        gestor: gestorPda, receta: recetaPda, ticket: ticketPda,
        comprador: wallet.publicKey, autoridad: wallet.publicKey, systemProgram: anchor.web3.SystemProgram.programId,
      }).rpc();
      
    const ticket = await program.account.ticket.fetch(ticketPda);
    console.log(`🧾 Ticket creado. Ganancia neta de la venta: $${ticket.ganancia.toNumber() / 100} MXN`);
  });
});
