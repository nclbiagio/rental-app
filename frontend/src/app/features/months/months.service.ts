import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import type {
  ApiResponse,
  MonthRecord,
  MonthPayload,
  ExpensePayload,
  Expense,
} from '@app/shared/types';

@Injectable({
  providedIn: 'root',
})
export class MonthsFacade {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /**
   * Crea un nuovo mese base.
   * NOTA BACKEND: Se ci sono spese ricorrenti, il backend le crea in automatico e
   * restituisce il Mese completo (con l'array Expenses popolato).
   */
  public async createMonth(propId: string, payload: MonthPayload): Promise<MonthRecord> {
    const response = await firstValueFrom(
      this.http.post<ApiResponse<MonthRecord>>(
        `${this.baseUrl}/properties/${propId}/months`,
        payload,
      ),
    );
    return response.data;
  }

  /**
   * Recupera il dettaglio di un mese specifico (inclusivo delle sue righe di spesa)
   */
  public async getMonthById(propId: string, monthId: string): Promise<MonthRecord> {
    const response = await firstValueFrom(
      this.http.get<ApiResponse<MonthRecord>>(
        `${this.baseUrl}/properties/${propId}/months/${monthId}`,
      ),
    );
    return response.data;
  }

  /**
   * Aggiorna i dati base del mese (anno, mese, agenzia, note)
   */
  public async updateMonth(
    propId: string,
    monthId: string,
    payload: Partial<MonthPayload>,
  ): Promise<MonthRecord> {
    const response = await firstValueFrom(
      this.http.put<ApiResponse<MonthRecord>>(
        `${this.baseUrl}/properties/${propId}/months/${monthId}`,
        payload,
      ),
    );
    return response.data;
  }

  // --- METODI PER LE SINGOLE RIGHE DI SPESA ---
  // Dato che la tua API gestisce le spese separatamente, ci serviranno questi metodi
  // per aggiungere/rimuovere righe dinamicamente se l'utente salva il mese ed è in modalità "Modifica".

  public async addExpense(
    propId: string,
    monthId: string,
    payload: ExpensePayload,
  ): Promise<Expense> {
    const response = await firstValueFrom(
      this.http.post<ApiResponse<Expense>>(
        `${this.baseUrl}/properties/${propId}/months/${monthId}/expenses`,
        payload,
      ),
    );
    return response.data;
  }

  public async deleteExpense(propId: string, monthId: string, expenseId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete<ApiResponse<any>>(
        `${this.baseUrl}/properties/${propId}/months/${monthId}/expenses/${expenseId}`,
      ),
    );
  }
}
