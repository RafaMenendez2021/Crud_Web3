import BN from "bn.js";
import * as web3 from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import * as web3 from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import type { State } from "../target/types/state";

// Configure the client to use the local cluster
anchor.setProvider(anchor.AnchorProvider.env());

const program = anchor.workspace.State as anchor.Program<State>;


const program = program;
const wallet = pg.wallet;

async function main() {
  console.log("🍞 ¡Iniciando el tour automático de la Panadería Web3!");

  const [gestorPda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("gestor"), wallet.publicKey.toBuffer()],
    program.programId
  );

  // 1. Inicializar
  const info = await program.provider.connection.getAccountInfo(gestorPda);
  if (!info) {
    console.log("⏳ Inicializando gestor...");
    await program.methods.inicializarGestor().accounts({
      gestor: gestorPda,
      autoridad: wallet.publicKey,
      systemProgram: web3.SystemProgram.programId,
    }).rpc();
    console.log("✅ Gestor inicializado con éxito.");
  } else {
    console.log("✅ El Gestor ya estaba inicializado.");
  }

  const gestor = await program.account.gestor.fetch(gestorPda);
  
  // 2. Crear Receta
  const idReceta = gestor.totalRecetas;
  const [recetaPda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("receta"), gestorPda.toBuffer(), idReceta.toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  console.log(`\n📝 Creando receta 'Bolillo' (ID: ${idReceta.toString()})...`);
  await program.methods.crearReceta("Bolillo", new anchor.BN(1000000), new anchor.BN(3000000), 20)
    .accounts({ gestor: gestorPda, receta: recetaPda, autoridad: wallet.publicKey, systemProgram: web3.SystemProgram.programId })
    .rpc();

  // 3. Hornear
  console.log("🔥 Horneando 5 lotes de Bolillos...");
  await program.methods.hornearPan(5)
    .accounts({ gestor: gestorPda, receta: recetaPda, autoridad: wallet.publicKey })
    .rpc();

  // 4. Vender
  const gestorActualizado = await program.account.gestor.fetch(gestorPda);
  const [ticketPda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("ticket"), gestorPda.toBuffer(), gestorActualizado.totalTickets.toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  console.log("💰 Vendiendo 10 Bolillos pagando con SOL...");
  await program.methods.registrarTicket("Cliente Nuevo", 10, false)
    .accounts({ gestor: gestorPda, receta: recetaPda, ticket: ticketPda, comprador: wallet.publicKey, autoridad: wallet.publicKey, systemProgram: web3.SystemProgram.programId })
    .rpc();

  // 5. Reporte
  const recetaFinal = await program.account.receta.fetch(recetaPda);
  const gestorFinal = await program.account.gestor.fetch(gestorPda);

  console.log("\n📊 --- REPORTE FINAL ---");
  console.log(`🥖 Inventario restante de Bolillos: ${recetaFinal.inventarioDisponible}`);
  console.log(`💵 Ingresos Totales (SOL): ${gestorFinal.ingresosTotales.toNumber() / web3.LAMPORTS_PER_SOL}`);
  console.log(`🎟️ Tickets vendidos en total: ${gestorFinal.totalTickets.toString()}`);
}

main().catch(console.error);