// L'entità completa restituita dal server
export interface ExpenseCategory {
  id: string;
  propertyId: string;
  name: string;
  isRecurring: boolean;
  recurringAmount: number | null;
}

// Payload per la POST e la PUT (creazione/modifica)
export interface CategoryPayload {
  name: string;
  isRecurring?: boolean;
  recurringAmount?: number | null;
}

// Risposta custom della tua API "copy-from"
export interface CopyCategoriesResponse {
  copied: number;
  message: string;
  categories?: ExpenseCategory[];
}
