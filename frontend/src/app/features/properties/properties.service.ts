import { Injectable, inject } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import type {
  ApiResponse,
  Property,
  PropertyPayload,
  PropertyStats,
  YearlyHistoryRecord,
} from '@app/shared/types';

@Injectable({
  providedIn: 'root',
})
export class PropertiesFacade {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/properties`;

  // 1. Un Signal interno che dice al Facade quale immobile stiamo guardando ora
  public currentHistoryPropId = signal<string | null>(null);

  /**
   * CREATE - POST /api/properties
   */
  public async createProperty(payload: PropertyPayload): Promise<Property> {
    const response = await firstValueFrom(
      this.http.post<ApiResponse<Property>>(this.baseUrl, payload),
    );
    return response.data;
  }

  /**
   * READ - GET /api/properties/:id
   */
  public async getPropertyById(id: string): Promise<Property> {
    const response = await firstValueFrom(
      this.http.get<ApiResponse<Property>>(`${this.baseUrl}/${id}`),
    );
    return response.data;
  }

  /**
   * UPDATE - PUT /api/properties/:id
   */
  public async updateProperty(id: string, payload: Partial<PropertyPayload>): Promise<Property> {
    const response = await firstValueFrom(
      this.http.put<ApiResponse<Property>>(`${this.baseUrl}/${id}`, payload),
    );
    return response.data;
  }

  /**
   * DELETE - DELETE /api/properties/:id
   */
  public async deleteProperty(id: string): Promise<void> {
    await firstValueFrom(
      this.http.delete<ApiResponse<{ message: string }>>(`${this.baseUrl}/${id}`),
    );
  }

  /**
   * TOGGLE ARCHIVE - PATCH /api/properties/:id/(archive|unarchive)
   */
  public async toggleArchive(id: string, archive: boolean): Promise<Property> {
    const endpoint = archive ? 'archive' : 'unarchive';
    const response = await firstValueFrom(
      this.http.patch<ApiResponse<Property>>(`${this.baseUrl}/${id}/${endpoint}`, {}),
    );
    return response.data;
  }

  /**
   * GET /api/properties/:propId/stats
   */
  // 🚀 Riceve una funzione o un Signal che restituisce la stringa dell'ID
  public getStatsResource(propIdSignal: () => string) {
    // httpResource usa l'HttpClient internamente in automatico!
    return httpResource<ApiResponse<PropertyStats>>(
      () => `${this.baseUrl}/${propIdSignal()}/stats`,
    );
  }

  // Un SINGOLO httpResource che vive per sempre nel Facade.
  // Reagisce automaticamente ogni volta che cambia `currentHistoryPropId`
  public yearlyHistoryResource = httpResource<ApiResponse<YearlyHistoryRecord[]>>(() => {
    const id = this.currentHistoryPropId();
    // Se l'ID è null, httpResource sa che NON deve fare la chiamata HTTP
    if (!id) return undefined;

    // Se l'ID c'è, genera l'URL e fa la chiamata (se l'URL è identico a prima, non la rifà!)
    return `${this.baseUrl}/${id}/history`;
  });

  // 3. Metodo per invalidare la cache (es. se aggiungi un nuovo mese)
  public invalidateHistoryCache(): void {
    // Il resource di Angular 21 ha il metodo reload() nativo!
    this.yearlyHistoryResource.reload();
  }
}
