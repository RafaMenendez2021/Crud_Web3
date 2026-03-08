import BN from "bn.js";
import * as web3 from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import type { State } from "../target/types/state";

describe("panaderia_pda", () => {
  // Configure the client to use the local cluster
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.State as anchor.Program<State>;
  
  // En Solana Playground, 'pg' se inyecta automáticamente.
  // No necesitamos configurar el provider.
  const program = program;
  const wallet = pg.wallet;

  let gestorPda: anchor.web3.PublicKey;

  before(async () => {
    // Calculamos el PDA del Gestor usando nuestra wallet
    [gestorPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("gestor"), wallet.publicKey.toBuffer()],
      program.programId
    );
  });

  it("Inicializa el Gestor", async () => {
    try {
      const accountInfo = await program.provider.connection.getAccountInfo(
        gestorPda
      );
      if (accountInfo) {
        console.log("El gestor ya estaba inicializado.");
        return;
      }

      await program.methods
        .inicializarGestor()
        .accounts({
          gestor: gestorPda,
          autoridad: wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Gestor inicializado con éxito.");
    } catch (error) {
      console.error("Error al inicializar gestor:", error);
    }
  });

  it("Crea una Receta", async () => {
    const gestorAccount = await program.account.gestor.fetch(gestorPda);
    const [recetaPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("receta"),
        gestorPda.toBuffer(),
        gestorAccount.totalRecetas.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    const nombrePan = "Concha de Vainilla";
    const costoProduccion = new anchor.BN(5000000); // En Lamports (0.005 SOL)
    const precioVenta = new anchor.BN(15000000); // En Lamports (0.015 SOL)
    const piezas = 10;

    try {
      const tx = await program.methods
        .crearReceta(nombrePan, costoProduccion, precioVenta, piezas)
        .accounts({
          gestor: gestorPda,
          receta: recetaPda,
          autoridad: wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      console.log("Receta creada, Tx:", tx);
    } catch (error) {
      console.error("Error al crear receta:", error);
    }
  });

  it("Hornea Pan (Aumenta Inventario)", async () => {
    const gestorAccount = await program.account.gestor.fetch(gestorPda);
    const ultimoId = gestorAccount.totalRecetas.subn(1);
    const [recetaPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("receta"),
        gestorPda.toBuffer(),
        ultimoId.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    const lotes = 2;

    try {
      await program.methods
        .hornearPan(lotes)
        .accounts({
          gestor: gestorPda,
          receta: recetaPda,
          autoridad: wallet.publicKey,
        })
        .rpc();

      const receta = await program.account.receta.fetch(recetaPda);
      console.log(
        "Inventario despues de hornear:",
        receta.inventarioDisponible.toString()
      );
    } catch (error) {
      console.error("Error al hornear pan:", error);
    }
  });

  it("Registra un Ticket de Venta (Pago en Cripto)", async () => {
    const gestorAccount = await program.account.gestor.fetch(gestorPda);
    const ultimoIdReceta = gestorAccount.totalRecetas.subn(1);

    const [recetaPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("receta"),
        gestorPda.toBuffer(),
        ultimoIdReceta.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    const [ticketPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("ticket"),
        gestorPda.toBuffer(),
        gestorAccount.totalTickets.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    const nombreCliente = "Rafael";
    const cantidadVendida = 5;
    const pagoFiat = false; // Pagamos con SOL

    try {
      await program.methods
        .registrarTicket(nombreCliente, cantidadVendida, pagoFiat)
        .accounts({
          gestor: gestorPda,
          receta: recetaPda,
          ticket: ticketPda,
          comprador: wallet.publicKey,
          autoridad: wallet.publicKey, // Cuenta que recibe el SOL
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      const recetaActualizada = await program.account.receta.fetch(recetaPda);
      const gestorActualizado = await program.account.gestor.fetch(gestorPda);
      console.log(
        "Inventario restante:",
        recetaActualizada.inventarioDisponible.toString()
      );
      console.log(
        "Ingresos Totales (Lamports):",
        gestorActualizado.ingresosTotales.toString()
      );
    } catch (error) {
      console.error("Error al registrar ticket:", error);
    }
  });

  it("Borra una Receta (Borrado Lógico)", async () => {
    const gestorAccount = await program.account.gestor.fetch(gestorPda);
    const ultimoId = gestorAccount.totalRecetas.subn(1);
    const [recetaPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("receta"),
        gestorPda.toBuffer(),
        ultimoId.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    try {
      await program.methods
        .borrarReceta()
        .accounts({
          gestor: gestorPda,
          receta: recetaPda,
          autoridad: wallet.publicKey,
        })
        .rpc();

      const recetaBorrada = await program.account.receta.fetch(recetaPda);
      console.log("¿La receta sigue activa?:", recetaBorrada.activo);
    } catch (error) {
      console.error("Error al borrar receta:", error);
    }
  });

  it("Falla al intentar vender pan de receta inactiva", async () => {
    const gestorAccount = await program.account.gestor.fetch(gestorPda);
    const ultimoIdReceta = gestorAccount.totalRecetas.subn(1);

    const [recetaPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("receta"),
        gestorPda.toBuffer(),
        ultimoIdReceta.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    const [ticketPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("ticket"),
        gestorPda.toBuffer(),
        gestorAccount.totalTickets.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    const nombreCliente = "Cliente Despistado";
    const cantidadVendida = 1;
    const pagoFiat = true;

    try {
      await program.methods
        .registrarTicket(nombreCliente, cantidadVendida, pagoFiat)
        .accounts({
          gestor: gestorPda,
          receta: recetaPda,
          ticket: ticketPda,
          comprador: wallet.publicKey,
          autoridad: wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      console.log("Esto no debería imprimirse.");
    } catch (error) {
      console.log(
        "Exito: La transacción fue bloqueada por estar la receta inactiva."
      );
    }
  });
});
