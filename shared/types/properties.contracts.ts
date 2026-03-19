/**
 * Payload inviato dal Frontend al Backend per la creazione (POST)
 * o l'aggiornamento (PUT) di un immobile.
 * Rispecchia esattamente i campi validati dal tuo schema Zod.
 */
export interface PropertyPayload {
  /** Nome dell'immobile (max 100 char) */
  name: string;

  /** Indirizzo fisico (opzionale, max 255 char) */
  address?: string | null;

  /** Note aggiuntive a testo libero (opzionali) */
  notes?: string | null;

  /** Data di inizio rendicontazione nel formato "YYYY-MM-DD" */
  startDate: string;
}

/**
 * Entità Immobile completa, restituita dal Database del Backend.
 * Estende il payload iniziale aggiungendo i campi generati dal server.
 */
export interface Property extends PropertyPayload {
  /** Identificativo univoco dell'immobile (es. UUID o numero) */
  id: string;

  /** Stato di archiviazione (gestito tramite le rotte PATCH) */
  archived: boolean;

  /** Data di creazione del record nel DB (formato ISO 8601) */
  createdAt?: string;

  /** Data dell'ultimo aggiornamento del record (formato ISO 8601) */
  updatedAt?: string;
}

//PROP STATS

export interface MonthPerformance {
  year: number;
  month: number;
  amount: number;
}

export interface ExpenseCategoryStat {
  categoryName: string;
  total: number;
  percentage: number;
}

export interface MonthlyTrendStat {
  id: string;
  year: number;
  month: number;
  agencyNetIncome: number;
  totalExpenses: number;
  netResult: number;
}

export interface PropertyStats {
  allTimeAvg: number;
  last12Avg: number;
  currentYearTotal: number;
  currentYearNetTotal: number;
  bestMonth: MonthPerformance | null;
  worstMonth: MonthPerformance | null;
  expensesByCategory: ExpenseCategoryStat[];
  monthlyTrend: MonthlyTrendStat[];
}
