# Documentazione API Backend - Rental App

Questo documento elenca le API REST disponibili nel backend per la gestione degli immobili, categorie, flussi mensili, spese e statistiche.

L'endpoint base locale è: `http://localhost:3000`

Tutti gli endpoint restituiscono le risposte in formato JSON incapsulato in un wrapper standard:

- **Successo:** `{ "success": true, "data": { ... } }`
- **Errore:** `{ "success": false, "error": { "code": "ERR_CODE", "message": "...", "errors": [...] } }`

---

## 1. Proprietà (`/api/properties`)

Gestione generale degli immobili (Property).

- **`GET /api/properties`**
  - Mostra le proprietà attive.
  - _Query opzionale_: `?archived=true` per mostrare anche quelle archiviate.

- **`POST /api/properties`**
  - Registra un nuovo immobile.
  - _Body richiesto_: `name` (string), `startDate` (YYYY-MM-DD). Opzionali: `address`, `notes`.

- **`GET /api/properties/:id`**
  - Restituisce i dettagli dell'immobile indicato tramite l'ID.

- **`PUT /api/properties/:id`**
  - Aggiorna i dettagli dell'immobile.

- **`DELETE /api/properties/:id`**
  - Rimuove definitivamente l'immobile in cascata (elimina mesi, categorie, spese ad esso collegate).

- **`PATCH /api/properties/:id/archive`**
  - Nasconde la proprietà dalla dashboard (imposta `archived: true`).

- **`PATCH /api/properties/:id/unarchive`**
  - Ripristina tra le proprietà attive un immobile precedentemente archiviato.

---

## 2. Categorie di Spesa (`/api/properties/:propId/categories`)

Gestione delle tipologie di spese personalizzate per una singola proprietà.

- **`GET .../categories`**
  - Ritorna l'elenco alfabetico di tutte le categorie dell'immobile indicato nel parametro `:propId`.

- **`POST .../categories`**
  - Registra una nuova categoria.
  - _Body richiesto_: `name` (string). Opzionali: `isRecurring` (boolean, default false), `recurringAmount` (number).

- **`PUT .../categories/:id`**
  - Aggiorna i dati della categoria.

- **`DELETE .../categories/:id`**
  - Elimina la categoria (le singole vecchie spese di questa categoria verranno riassegnate al valore Null in modo da non perdere il computo economico nel passato).

- **`POST .../categories/copy-from/:sourcePropId`**
  - Endpoint utilità: Copia tutte le categorie da una proprietà `sourcePropId` verso `propId`. Non duplica catagorie il cui nome esiste già (case-insensitive).

---

## 3. Resoconti Mensili (`/api/properties/:propId/months`)

Il fulcro della contabilità: ogni record rappresenta l'incasso e le associazioni di un determinato mese/anno per l'immobile.

- **`GET .../months`**
  - Ritorna la lista storica dei mesi (con array `expenses` inglobato per ogni mese).
  - Include calcoli arricchiti: `netResult` (utile netto del mese scalate le spese) e `avgDeviation` (quanto questo mese si discosta dalla media di incasso di sempre della proprietà).
  - _Filtri query_:
    - `?year=2024` : tutti i mesi del 2024
    - `?from=2024-01&to=2024-12` : Range tra date specifiche.

- **`POST .../months`**
  - Crea un record per un tracciato mensile.
  - _Speciale_: Se la proprietà ha categorie segnate come "ricorrenti" (`isRecurring`), la API popolerà fin da subito il mese con tali spese (es. Tassa mensile automatica).
  - _Protezione Dati_: Previene doppioni per lo stesso mese/anno (Errore `409 DUPLICATE_MONTH`).
  - _Body richiesto_: `year`, `month`, `agencyNetIncome`.

- **`GET .../months/:id`**
  - Restituisce il resoconto completo del singolo mese richiesto assieme a tutte le voci di spesa con le rispettive Categorie decodificate.

- **`PUT .../months/:id`**
  - Aggiorna i dati mensili o la nota salvata su di esso (valida l'anno unicità al salvataggio).

---

## 4. Spese (Expenses) (`.../months/:monthId/expenses`)

Aggiunta, rimozione e modifica di flussi d'uscita per uno specifico `MonthRecord`.

- **`POST .../months/:monthId/expenses`**
  - Registra una spesa nel mese.
  - _Body richiesto_: `amount` (number, positivo). Opzionali: `categoryId` (UUID di ExpenseCategory), `description` (string).

- **`PUT .../months/:monthId/expenses/:id`**
  - Aggiorna l'importo o la descrizione della spesa.

- **`DELETE .../months/:monthId/expenses/:id`**
  - Elimina una spesa passata per ricalcolare il bilancio corretto del mese.

---

## 5. View & Statistiche

Queste route restituiscono raggruppamenti elaborati (analytics) pronti da proiettare sul front-end:

### Analytics Immobile (`GET /api/properties/:propId/stats`)

Ritorna un blocco unico di statistiche avanzate per il pannello dettaglio della proprietà:

```json
{
  "allTimeAvg": 1250,           // Media di ricavo mensile (al netto) calcolata da sempre
  "last12Avg": 1300,            // Come sopra, ma ricalibrato solo per gli ultimi 12 inseriti
  "currentYearTotal": 10500,    // Somma di ciò che ti è entrato lordo (agencyNetIncome) nell'anno corrente
  "currentYearNetTotal": 8500,  // Ricavo lordo - spese dell'anno corrente
  "bestMonth": { "year": 2024, "month": 8, "amount": 2500 },
  "worstMonth": { "year": 2024, "month": 2, "amount": 80 },
  "expensesByCategory": [       // Classifica spesa suddivisa con calcolo d'incidenza (%) in ordine descrescente
     { "categoryName": "Manutenzione", "total": 1500, "percentage": 75 },
     ...
  ],
  "monthlyTrend": [             // Array cronologico per disegnare grafici lineari sul Front-end
    { "year": 2024, "month": 1, "agencyNetIncome": 1200, "totalExpenses": 0, "netResult": 1200 }
  ]
}
```

### Dashboard Globale Utente (`GET /api/dashboard`)

Richiamato spesso nella Main Page all'inizio della App, restituisce un array in cui ogni nodo rappresenta un Immobile attivo e indica rapidamente il suo "salute":

```json
[
  {
    "propertyId": "uuid-...",
    "propertyName": "Casa al Mare",
    "lastMonthNetResult": 1400, // Come stiamo andati nello step precedente dell'anno
    "ytdNetResult": 2800, // Quanto è stato accantonato fisicamente da Gennaio dell'anno corrente
    "avgMonthly": 1200, // Profitto statistico stimato
    "missingMonths": [
      // Array intelligente che confronta la startDate dell'immobile fino a oggi...
      { "year": 2024, "month": 3 } // ...e ci avvisa se questo mese non è stato ancora compilato
    ]
  }
]
```
