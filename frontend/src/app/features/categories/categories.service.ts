import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { ApiResponse } from '@app/shared/types'; // Adatta il path se serve
import type {
  ExpenseCategory,
  CategoryPayload,
  CopyCategoriesResponse,
} from '@app/shared/types/categories.contracts';

@Injectable({
  providedIn: 'root',
})
export class CategoriesFacade {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /**
   * Recupera tutte le categorie di una specifica proprietà (ordinate per nome dal backend)
   */
  public async getCategories(propId: string): Promise<ExpenseCategory[]> {
    const response = await firstValueFrom(
      this.http.get<ApiResponse<ExpenseCategory[]>>(
        `${this.baseUrl}/properties/${propId}/categories`,
      ),
    );
    return response.data;
  }

  /**
   * Crea una nuova categoria (singola o ricorrente)
   */
  public async createCategory(propId: string, payload: CategoryPayload): Promise<ExpenseCategory> {
    const response = await firstValueFrom(
      this.http.post<ApiResponse<ExpenseCategory>>(
        `${this.baseUrl}/properties/${propId}/categories`,
        payload,
      ),
    );
    return response.data;
  }

  /**
   * Aggiorna una categoria esistente
   */
  public async updateCategory(
    propId: string,
    categoryId: string,
    payload: Partial<CategoryPayload>,
  ): Promise<ExpenseCategory> {
    const response = await firstValueFrom(
      this.http.put<ApiResponse<ExpenseCategory>>(
        `${this.baseUrl}/properties/${propId}/categories/${categoryId}`,
        payload,
      ),
    );
    return response.data;
  }

  /**
   * Elimina una categoria
   */
  public async deleteCategory(propId: string, categoryId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete<ApiResponse<{ message: string }>>(
        `${this.baseUrl}/properties/${propId}/categories/${categoryId}`,
      ),
    );
  }

  /**
   * Clona le categorie da un'altra proprietà
   */
  public async copyCategoriesFromProperty(
    targetPropId: string,
    sourcePropId: string,
  ): Promise<CopyCategoriesResponse> {
    const response = await firstValueFrom(
      this.http.post<ApiResponse<CopyCategoriesResponse>>(
        `${this.baseUrl}/properties/${targetPropId}/categories/copy-from/${sourcePropId}`,
        {}, // Corpo della POST vuoto, usiamo i parametri dell'URL
      ),
    );
    return response.data;
  }
}
