# Documentazione Zod e Validazione API

Questo documento spiega come funziona il nostro sistema di validazione dei dati in ingresso, basato sulla libreria **Zod** (`zod.dev`).

Zod ci permette di creare uno "schema" (una mappa precisa) di come ci aspettiamo che siano formattati i dati ricevuti dal Frontend prima ancora di processarli nel Backend.

---

## 1. Come è strutturato Zod nel progetto?

Tutta la logica si basa su due file principali:

- `src/middleware/validate.ts`: È il "poliziotto" di guardia. Intercetta la richiesta HTTP, prende il `req.body` e lo passa allo Schema Zod. Se Zod approva, la richiesta prosegue al Controller. Se Zod trova discrepanze (es. manca un campo o una data è sbagliata), blocca tutto e lancia un errore `422 VALIDATION_ERROR` standardizzato senza che il Controller venga nemmeno eseguito.
- `src/validators/index.ts`: La nostra "costituzione". Qui sono definiti tutti gli schemi (le regole) che il poliziotto userà per controllare le richieste.

---

## 2. Dettaglio degli Schemi Esistenti (`validators/index.ts`)

Ecco le regole che abbiamo impostato:

### A. Proprietà (`Property`)

- `name`: Stringa obbligatoria. Errore se vuota o più lunga di 100 caratteri.
- `address`: Stringa libera, opzionale, massimo 255 caratteri.
- `notes`: Testo libero, opzionale.
- `startDate`: Testo obbligatorio.
  - **Regola speciale (`refine`)**: Controlliamo matematicamente che la stringa fornita (es: `2024-05-01`) sia convertibile in una Data reale tramite `Date.parse(val)`. Se passi un formato fittizio come "Ciao-Mondo", Zod solleva l'errore: _"Data di inizio non valida"_.

### B. Categorie ( ExpenseCategories`)

- `name`: Obbligatorio, massimo 80 caratteri.
- `isRecurring`: Booleano opzionale (Di base, se il frontend non lo manda, il nostro codice nel controller assumerà `false`).
- `recurringAmount`: Numero opzionale.
  - **Regola speciale (`min(0)`)**: Blocca tentativi d'inserimento di importi negativi come `-150.50€`.

### C. Mesi (`MonthRecords`)

- `year`: Numero intero, minimo consentito 2000.
- `month`: Numero intero, deve essere per forza compreso tra `1` e `12`.
- `agencyNetIncome`: L'incasso (il profitto d'agenzia).
  - **Regola speciale (`or(z.string).transform`)**: Spesso il frontend HTTP, o un form-data, invia i numeri incapsulati in stringhe (es: `"1500.25"` invece di `1500.25`). Zod qui è flessibile: se riceve un numero lo accetta direttamente, se riceve una stringa controlla che contenga davvero un numero, ed esegue lui stesso il `parseFloat()` prima di passare i dati al controller!
- `notes`: Testo libero, opzionale.

### D. Spese (`Expenses`)

- `categoryId`: Stringa opzionale.
  - **Regola speciale (`uuid()`)**: Poiché le nostre categorie nel Server Database usano l'UUIDv4 con Sequelize, qua Zod verifica tramite Regex che la stringa inviata dal client sia effettivamente nel formato di un Universally Unique Identifier standard (es. `123e4567-e89b-12d3...`) e non una scritta a caso.
- `amount`: Numero obbligatorio (o stringa numerica che viene parificata tramite `transform`).
  - **Regola speciale (`min(0)`)**: Blocca importi negativi.
- `description`: Testo libero, massimo 255 caratteri, opzionale.

---

## 3. Vantaggi

Grazie a questa configurazione, non abbiamo più bisogno di intasare l'inizio di ogni route con codice come:

```typescript
// VECCHIO SISTEMA PIENO DI BUG E NOIA
if (!req.body.name) return res.status(400);
if (req.body.amount < 0) return res.status(400);
if (isNaN(req.body.year)) return res.status(400);
```

Il Controller esegue unicamente il salvataggio sul Database dando per scontato (sicuro al 100% per merito di TS) che i parametri di `req.body` siano perfetti e nei formati corretti!
