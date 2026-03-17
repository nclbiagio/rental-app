import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { ApiResponse, Property, PropertyPayload } from '@app/shared/types';

@Injectable({
    providedIn: 'root'
})
export class PropertiesFacade {
    private http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/properties`;

    /**
     * CREATE - POST /api/properties
     */
    public async createProperty(payload: PropertyPayload): Promise<Property> {
        const response = await firstValueFrom(
            this.http.post<ApiResponse<Property>>(this.baseUrl, payload)
        );
        return response.data;
    }

    /**
     * READ - GET /api/properties/:id
     */
    public async getPropertyById(id: string): Promise<Property> {
        const response = await firstValueFrom(
            this.http.get<ApiResponse<Property>>(`${this.baseUrl}/${id}`)
        );
        return response.data;
    }

    /**
     * UPDATE - PUT /api/properties/:id
     */
    public async updateProperty(id: string, payload: Partial<PropertyPayload>): Promise<Property> {
        const response = await firstValueFrom(
            this.http.put<ApiResponse<Property>>(`${this.baseUrl}/${id}`, payload)
        );
        return response.data;
    }

    /**
     * DELETE - DELETE /api/properties/:id
     */
    public async deleteProperty(id: string): Promise<void> {
        await firstValueFrom(
            this.http.delete<ApiResponse<{ message: string }>>(`${this.baseUrl}/${id}`)
        );
    }

    /**
     * TOGGLE ARCHIVE - PATCH /api/properties/:id/(archive|unarchive)
     */
    public async toggleArchive(id: string, archive: boolean): Promise<Property> {
        const endpoint = archive ? 'archive' : 'unarchive';
        const response = await firstValueFrom(
            this.http.patch<ApiResponse<Property>>(`${this.baseUrl}/${id}/${endpoint}`, {})
        );
        return response.data;
    }
}