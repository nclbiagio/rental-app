export * from "./dashboard.contracts";
export * from "./properties.contracts";
export * from "./months.contracts";
export * from "./categories.contracts";

/**
 * Struttura standard di tutte le risposte del nostro Backend
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string; // Utile se in futuro vuoi passare messaggi di errore
}
