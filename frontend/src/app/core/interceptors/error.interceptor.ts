import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorService } from '../services/error.service';
import { GlobalErrorBannerComponent } from '../components/global-error-banner.component';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  // In un functional interceptor usiamo 'inject' direttamente
  const errorService = inject(ErrorService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // 🚨 IL VIGILE INTERVIENE SOLO PER GLI ERRORI CRITICI (0 o 500+)
      if (error.status === 0 || error.status >= 500) {
        // 1. Chiediamo al Dizionario la traduzione
        const message = errorService.handleHttpError(error);

        // 2. Apriamo il banner invece della SnackBar
        // Usiamo la chiamata statica del componente!
        GlobalErrorBannerComponent.show({
          message,
          type: error.status === 0 ? 'warning' : 'critical', // Giallo per Rete, Rosso per Server
        });
      }

      // 🚦 IN TUTTI I CASI, facciamo passare la "macchina" (l'errore)
      // Se è un 400/409 (Business), il componente lo gestirà mostrando l'errore nel form.
      // Se è un 500/0 (Sistema), il Vigile ha già fischiato e mostrato il banner globale.
      return throwError(() => error);
    }),
  );
};
