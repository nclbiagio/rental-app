import type { ExpenseCategory } from "./categories.contracts";

// ---------------------------------------------------------
// 2. Spese (Singola riga)
// ---------------------------------------------------------
// Payload per creare/aggiornare una spesa
export interface ExpensePayload {
  categoryId: string | null;
  amount: number;
  description?: string | null;
}

// L'entità Spesa completa che torna dal backend
export interface Expense extends ExpensePayload {
  id: string;
  monthRecordId: string;
  ExpenseCategory?: ExpenseCategory; // Sequelize include questo oggetto grazie al join
}

// ---------------------------------------------------------
// 3. Mese (Month Record)
// ---------------------------------------------------------
// Payload per la POST/PUT del mese base (senza l'array di spese)
export interface MonthPayload {
  year: number;
  month: number;
  agencyNetIncome: number;
  notes?: string | null;
}

// L'entità Mese completa che torna dal backend
export interface MonthRecord extends MonthPayload {
  id: string;
  propertyId: string;
  Expenses?: Expense[]; // L'array di righe di spesa collegate

  // Campi calcolati dal server (restituiti dalla GET /propId/months)
  netResult?: number;
  avgDeviation?: number;
}

export interface YearlyHistoryRecord {
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
}
