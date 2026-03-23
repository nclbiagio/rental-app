import { test, expect } from "@playwright/test";

test.describe("Flusso Gestione Immobili e Mesi", () => {
  test("Crea un immobile, aggiunge un mese e blocca i duplicati", async ({
    page,
  }) => {
    // 1. Vai alla homepage
    await page.goto("/");

    // --- FASE 1: CREAZIONE IMMOBILE ---
    // Clicca il bottone per aggiungere un immobile (adatta il nome se diverso)
    await page.getByRole("button", { name: /Aggiungi immobile/i }).click();

    // Compila il form. getByLabel cerca la <label> associata all'input.
    // Sostituisci 'Nome' e 'Indirizzo' con le tue label reali!
    await page.getByLabel(/Nome/i).fill("Casa Vacanze Test");
    await page.getByLabel(/Indirizzo/i).fill("Via dei Test 123");
    await page.getByLabel(/Data di inizio rendicontazione/i).fill("2026-01-01");

    // Salva l'immobile
    await page.getByRole("button", { name: /Salva immobile/i }).click();

    // Verifica che la card dell'immobile sia apparsa in lista e cliccaci sopra
    // 🚀 Troviamo la card specifica per l'immobile creato e clicchiamo il suo bottone "Compila ora"
    const card = page.locator("mat-card", { hasText: "Casa Vacanze Test" });
    await expect(card).toBeVisible();
    await card.getByRole("button", { name: /Compila ora/i }).click(); // Entriamo nel dettaglio dell'immobile

    // --- FASE 2: CREAZIONE PRIMO MESE ---
    // Clicca per aggiungere un mese
    await page.getByRole("button", { name: /Aggiungi Mese/i }).click();

    // Compila il mese (adottiamo il nuovo formato che è un unico campo)
    // 🚀 Usiamo il formato 'MMM yyyy' (es: 'ago 2026') per far sì che il DateAdapter di Angular lo riconosca correttamente
    await page.getByLabel(/Mese e Anno/i).fill("ago 2026");
    await page.getByLabel(/Guadagno Netto Agenzia/i).fill("1500");
    await page.keyboard.press("Tab"); // Fa scattare la validazione
    
    const salvaBtn = page.getByRole("button", { name: /Salva e Procedi/i });
    await expect(salvaBtn).toBeEnabled(); // Verifichiamo che sia abilitato prima di cliccare
    await salvaBtn.click();

    // 🚀 Dopo il salvataggio l'app rimane nel form (modalità Edit).
    // Aspettiamo che l'URL cambi da 'new' al nuovo ID del mese
    await page.waitForURL(/months\/(?!new).*/);

    // 🚀 Per vedere il mese "nella lista", dobbiamo tornare al dettaglio dell'immobile.
    // Il tasto 'arrow_back' nel MonthForm torna alla Dashboard, quindi da lì rientriamo nell'immobile.
    await page.locator("button").filter({ hasText: "arrow_back" }).click();
    await expect(page).toHaveURL(/dashboard/);
    
    // Rientriamo nell'immobile per vedere lo storico aggiornato
    await page.locator("mat-card", { hasText: "Casa Vacanze Test" }).getByRole("button", { name: /Compila ora/i }).click();

    // 🚀 Selezioniamo il tab "Storico Mesi" per vedere la tabella
    await page.getByRole("tab", { name: /Storico Mesi/i }).click();

    // Verifica che il mese sia apparso nella tabella dello storico.
    // Nella tabella viene usato il nome intero (es: 'Agosto 2026')
    await expect(page.getByText("Agosto 2026")).toBeVisible();

    // --- FASE 3: IL VIGILE URBANO (Test Errore Duplicato) ---
    // Riproviamo a creare Agosto 2026
    await page.getByRole("button", { name: /Aggiungi Mese/i }).click();
    await page.getByLabel(/Mese e Anno/i).fill("ago 2026");
    await page.getByLabel(/Guadagno Netto Agenzia/i).fill("1500");
    await page.keyboard.press("Tab");
    await page.getByRole("button", { name: /Salva e Procedi/i }).click();

    // 🚀 IL MOMENTO DELLA VERITÀ
    // Cerchiamo il messaggio di errore che il backend ci restituisce.
    const errorBanner = page.getByText(
      /Questo mese esiste già per questo immobile/i,
    );

    // Verifichiamo che il banner sia visibile e che l'app non sia esplosa
    await expect(errorBanner).toBeVisible();
  });
});
