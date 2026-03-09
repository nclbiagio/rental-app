# Modelli Database e Associazioni

Questo documento descrive in modo semplice le relazioni (associazioni) tra le tabelle del database della nostra applicazione, gestite tramite Sequelize.

## Le Tabelle in Gioco

Abbiamo quattro modelli principali:

1. **Property** (Immobile)
2. **ExpenseCategory** (Categoria di spesa)
3. **MonthRecord** (Resoconto Mensile)
4. **Expense** (Singola Spesa viva)

---

## 1. Property ↔ ExpenseCategory (Relazione Uno-a-Molti)

### `Property.hasMany(ExpenseCategory)`

- **Spiegazione**: Ogni immobile (`Property`) possiede diverse e specifiche categorie di spesa (es. "Manutenzione", "Tasse comunali", "Rata del Mutuo").
- **Comportamento alla cancellazione** (`CASCADE`): Se elimini un Immobile dal sistema, vengono rimosse automaticamente tutte le categorie di spesa che gli appartenevano. Non ha senso conservare la categoria "Tasse" di una casa che non gestisci più.

## 2. Property ↔ MonthRecord (Relazione Uno-a-Molti)

### `Property.hasMany(MonthRecord)`

- **Spiegazione**: Per ogni Immobile tieni traccia dell'andamento finanziario mese per mese. Ogni `MonthRecord` "condensa" l'incasso di affitto (Agency Net Income) validato in uno specifico anno (es. 2026) e mese (es. 2, Febbraio).
- **Comportamento alla cancellazione** (`CASCADE`): Elimini la casa -> elimini lo storico di tutti i suoi mesi nel database.
- **Unicità**: Il database non permette di avere due resoconti di "Gennaio 2026" per lo stesso immobile; forza l'unicità combinando _Id immobile + anno + mese_.

## 3. MonthRecord ↔ Expense (Relazione Uno-a-Molti)

### `MonthRecord.hasMany(Expense)`

- **Spiegazione**: Ogni singolo mese registrato può "subire" più spese (`Expense`). Per esempio, a Febbraio potresti avere una spesa idraulica e una per la potatura del giardino.
- **Comportamento alla cancellazione** (`CASCADE`): Cancellando tutto il repilogo del mese, le spese contenute in esso vengono spazzate via dal sistema.

## 4. ExpenseCategory ↔ Expense (Relazione Uno-a-Molti)

### `ExpenseCategory.hasMany(Expense)`

- **Spiegazione**: Ogni Spesa inserita all'interno di un mese viene tipizzata assegnandole una Categoria (quella della casa). Avrai le spese idrauliche che puntano alla categoria "Manutenizone", le spese per le luci sotto la categoria "Utenze".
- **Comportamento alla cancellazione** (`SET NULL`): Qui la logica cambia volontariamente. Se decidi di eliminare la **Categoria di Spesa** "Manutenzione", le singole spese storiche sostenute a Gennaio, Febbraio ecc., NON vengono distrutte. L'importo (es. 150€) resta inalterato per non sballare i conti; semplicemente il database rimuove il "tag" della categoria impostandolo a `null`. Verrà segnalata come "Spesa senza categoria", ma il calcolo matematico non perderà i 150€ usciti.
