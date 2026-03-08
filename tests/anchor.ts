import BN from "bn.js";
import * as web3 from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import type { State } from "../target/types/state";

describe("panaderia_pda", () => {
  // Configure the client to use the local cluster
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.State as anchor.Program<State>;
  
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = program;
  const wallet = pg.wallet;

  let gestorPda: anchor.web3.PublicKey;

  before(async () => {
    [gestorPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("gestor"), wallet.publicKey.toBuffer()],
      program.programId
    );
  });

  it("Inicializa el Gestor", async () => {
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
    } catch (error) {
      console.error(error);
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
    const costoProduccion = new BN(50);
    const precioVenta = new BN(150);
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
      console.log("Receta creada:", tx);
    } catch (error) {
      console.error(error);
    }
  });

  it("Hornea Pan (Aumenta Inventario)", async () => {
    const gestorAccount = await program.account.gestor.fetch(gestorPda);
    const ultimoId = gestorAccount.totalRecetas.subn(1);
    const [recetaPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("receta"), gestorPda.toBuffer(), ultimoId.toArrayLike(Buffer, "le", 8)],
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
      console.log("Inventario despues de hornear:", receta.inventarioDisponible.toString());
    } catch (error) {
      console.error(error);
    }
  });

  it("Registra un Ticket de Venta", async () => {
    const gestorAccount = await program.account.gestor.fetch(gestorPda);
    const ultimoIdReceta = gestorAccount.totalRecetas.subn(1);
    
    const [recetaPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("receta"), gestorPda.toBuffer(), ultimoIdReceta.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const [ticketPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("ticket"), gestorPda.toBuffer(), gestorAccount.totalTickets.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const nombreCliente = "Rafael";
    const cantidadVendida = 5;
    const gananciaCalculada = new BN(50);

    try {
      await program.methods
        .registrarTicket(nombreCliente, cantidadVendida, gananciaCalculada)
        .accounts({
          gestor: gestorPda,
          receta: recetaPda,
          ticket: ticketPda,
          comprador: wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      const recetaActualizada = await program.account.receta.fetch(recetaPda);
      console.log("Inventario restante despues de vender:", recetaActualizada.inventarioDisponible.toString());
    } catch (error) {
      console.error(error);
    }
  });

  it("Falla al intentar vender mas pan del disponible", async () => {
    const gestorAccount = await program.account.gestor.fetch(gestorPda);
    const ultimoIdReceta = gestorAccount.totalRecetas.subn(1);
    
    const [recetaPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("receta"), gestorPda.toBuffer(), ultimoIdReceta.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const [ticketPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("ticket"), gestorPda.toBuffer(), gestorAccount.totalTickets.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const nombreCliente = "Cliente Exigente";
    const cantidadVendida = 100; 
    const gananciaCalculada = new BN(1000);

    try {
      await program.methods
        .registrarTicket(nombreCliente, cantidadVendida, gananciaCalculada)
        .accounts({
          gestor: gestorPda,
          receta: recetaPda,
          ticket: ticketPda,
          comprador: wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      console.log("Esto no deberia imprimirse, la venta debio fallar.");
    } catch (error) {
      console.log("Exito: La transaccion fue bloqueada por inventario insuficiente.");
    }
  });

  it("Actualiza una Receta", async () => {
    const gestorAccount = await program.account.gestor.fetch(gestorPda);
    const ultimoId = gestorAccount.totalRecetas.subn(1);
    const [recetaPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("receta"), gestorPda.toBuffer(), ultimoId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const nuevoCosto = new BN(60);
    const nuevoPrecio = new BN(180);

    try {
      await program.methods
        .actualizarReceta(nuevoCosto, nuevoPrecio)
        .accounts({
          gestor: gestorPda,
          receta: recetaPda,
          autoridad: wallet.publicKey,
        })
        .rpc();
    } catch (error) {
      console.error(error);
    }
  });

  it("Borra una Receta", async () => {
    const gestorAccount = await program.account.gestor.fetch(gestorPda);
    const ultimoId = gestorAccount.totalRecetas.subn(1);
    const [recetaPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("receta"), gestorPda.toBuffer(), ultimoId.toArrayLike(Buffer, "le", 8)],
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
    } catch (error) {
      console.error(error);
    }
  });
});