import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class NavigationHistoryService {
  private router = inject(Router);
  private history: string[] = [];

  constructor() {
    // Ci mettiamo in ascolto SOLO degli eventi di navigazione completata
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe({
        next: (event) => {
          // Aggiungiamo l'URL effettivo (dopo eventuali redirect) allo storico
          this.history.push(event.urlAfterRedirects);
        },
      });
  }

  // Il metodo magico che chiameremo dai bottoni
  public goBack(fallbackUrl: string = '/dashboard'): void {
    // 1. Rimuoviamo la pagina corrente (quella in cui ci troviamo ora)
    this.history.pop();

    // 2. Controlliamo se c'è una pagina precedente
    if (this.history.length > 0) {
      // Estraiamo la pagina precedente dallo storico
      const previousUrl = this.history.pop();

      // Navighiamo verso la pagina precedente.
      // (Nota: questa navigazione scatenerà un nuovo NavigationEnd che rimetterà l'URL in cima alla lista, mantenendo lo storico coerente!)
      if (previousUrl) {
        this.router.navigateByUrl(previousUrl);
      }
    } else {
      // 3. Fallback: lo storico è vuoto (es. utente entrato da link diretto)
      this.router.navigateByUrl(fallbackUrl);
    }
  }
}
