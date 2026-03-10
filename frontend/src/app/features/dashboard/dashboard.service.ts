import { Injectable, computed } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import type { PropertyHealth, ApiResponse } from '@app/shared/types';

@Injectable({
  providedIn: 'root',
})
export class DashboardFacade {
  // 1. LA RISORSA: Si aspetta la struttura completa { success: true, data: [...] }
  public dashboardResource = httpResource<ApiResponse<PropertyHealth[]>>(
    () => `${environment.apiUrl}/dashboard`,
  );

  // 2. IL SELETTORE SICURO: Estrae solo "data" se c'è success, altrimenti array vuoto
  public properties = computed<PropertyHealth[]>(() => {
    const res = this.dashboardResource.value();

    if (res?.success && Array.isArray(res.data)) {
      return res.data;
    }

    return [] as PropertyHealth[]; // <-- Il cast qui risolve il dubbio di TypeScript
  });

  // 3. LOGICA DERIVATA: Ora lavora in totale sicurezza sull'array puro
  public totalPortfolioYtd = computed(() =>
    this.properties().reduce((sum: number, prop: PropertyHealth) => sum + prop.ytdNetResult, 0),
  );

  public propertiesNeedingAttention = computed(() =>
    this.properties().filter((prop: PropertyHealth) => prop.missingMonths.length > 0),
  );

  public refreshData(): void {
    this.dashboardResource.reload();
  }
}
