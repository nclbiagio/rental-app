import { Router, Request, Response } from "express";
import fs from "fs/promises";
import path from "path";

// 🚀 Assicurati che questo path punti al file dove esporti l'istanza di Sequelize
import { sequelize } from "../models/index.js";

const router = Router();

// Percorsi fisici dei file
const DB_PATH = path.resolve("./dev-database.sqlite");
const BACKUP_DIR = path.resolve("./db-backups");

// 🚧 MIDDLEWARE DI SICUREZZA: Blocca tutto se siamo in produzione
router.use(async (req: Request, res: Response, next) => {
  if (process.env.NODE_ENV === "production") {
    return res.error(
      403,
      "FORBIDDEN",
      "Queste API sono disabilitate in produzione.",
    );
  }

  // Crea la cartella dei backup se non esiste
  try {
    await fs.access(BACKUP_DIR);
  } catch {
    await fs.mkdir(BACKUP_DIR);
  }
  next();
});

// 1️⃣ API: Lista tutti i file di backup
router.get("/db/backups", async (req: Request, res: Response) => {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    // Filtriamo solo i file sqlite e li ordiniamo dal più recente al più vecchio
    const sqliteFiles = files
      .filter((f) => f.endsWith(".sqlite"))
      .sort()
      .reverse();

    res.success(sqliteFiles);
  } catch (err: any) {
    res.error(500, "FS_ERROR", "Impossibile leggere la cartella dei backup.");
  }
});

// 2️⃣ API: Crea un nuovo backup (Copia)
router.post("/db/backup", async (req: Request, res: Response) => {
  try {
    // Generiamo un nome con timestamp pulito (es: backup-20231025-143000.sqlite)
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupName = `backup-${timestamp}.sqlite`;
    const destPath = path.join(BACKUP_DIR, backupName);

    await fs.copyFile(DB_PATH, destPath);
    res.success({
      message: "Backup creato con successo",
      filename: backupName,
    });
  } catch (err: any) {
    res.error(500, "COPY_ERROR", "Errore durante la copia del database.");
  }
});

// 3️⃣ API: Ripristina un backup (Sovrascrive e Riavvia)
router.post("/db/restore", async (req: Request, res: Response) => {
  try {
    const { filename } = req.body;
    if (!filename) return res.error(400, "BAD_REQUEST", "Nome file mancante");

    const sourcePath = path.join(BACKUP_DIR, filename);

    // 🚀 STEP 1: Sganciamo Sequelize per sbloccare il file SQLite dal sistema operativo
    await sequelize.close();

    // 🚀 STEP 2: Sovrascriviamo fisicamente il database con il backup
    await fs.copyFile(sourcePath, DB_PATH);

    // 🚀 STEP 3: Rispondiamo al frontend dicendo che è andato tutto a buon fine
    res.success({
      message: "Database ripristinato! Riavvio automatico in corso...",
    });

    // 🚀 STEP 4: L'INGANNO A TSX WATCH
    // Aspettiamo mezzo secondo per essere sicuri che la risposta HTTP sia partita,
    // dopodiché "tocchiamo" il file index.ts per simulare un salvataggio.
    setTimeout(async () => {
      try {
        const indexPath = path.resolve("./src/index.ts"); // Assicurati che il percorso sia giusto
        const now = new Date();
        await fs.utimes(indexPath, now, now); // Aggiorna Data di Modifica e Data di Accesso
        console.log("🔄 Trigger inviato a tsx watch: riavvio imminente!");
      } catch (triggerErr) {
        console.error("⚠️ Errore durante il trigger di riavvio:", triggerErr);
      }
    }, 500);
  } catch (err: any) {
    console.error(err);
    res.error(
      500,
      "RESTORE_ERROR",
      "Errore durante il ripristino del database.",
    );
  }
});

export default router;
