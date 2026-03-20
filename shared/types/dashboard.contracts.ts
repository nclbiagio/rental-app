/**
 * Rappresenta un mese/anno mancante per il quale
 * l'utente non ha ancora compilato o rendicontato i dati.
 */
export interface MissingMonth {
  year: number;
  month: number;
}

/**
 * Rappresenta la "salute" finanziaria e operativa di un singolo immobile.
 * Questo è il nodo principale restituito dall'array di GET /api/dashboard.
 */
export interface PropertyHealth {
  /** Identificativo univoco dell'immobile (es. UUID) */
  propertyId: string;

  /** Nome o alias assegnato all'immobile (es. "Casa al Mare") */
  propertyName: string;

  /** Risultato netto del mese precedente rispetto alla data attuale */
  lastMonthNetResult: number;

  /** Risultato netto accumulato da inizio anno corrente (Year-To-Date) */
  ytdNetResult: number;

  /** Stima statistica del profitto medio mensile */
  avgMonthly: number;

  /** * Array intelligente calcolato dal backend che confronta
   * la data di inizio dell'immobile fino ad oggi
   */
  missingMonths: MissingMonth[];

  /** Data di inizio dell'immobile */
  startDate: string | null;
}
