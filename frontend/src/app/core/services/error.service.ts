import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ErrorService {
  // 📚 Il nostro Dizionario dei codici di Business
  private readonly errorDictionary: Record<string, string> = {
    VALIDATION_ERROR: 'Dati non validi. Controlla i campi inseriti.',
    DUPLICATE_MONTH: 'Esiste già un record per questo mese.',
    NOT_FOUND: 'Elemento non trovato.',
    DUPLICATE_ENTRY: 'Elemento già esistente.',
    FOREIGN_KEY_ERROR: 'Riferimento non valido.',
  };

  /**
   * Riceve un HttpErrorResponse e restituisce una stringa user-friendly in italiano.
   */
  public handleHttpError(err: HttpErrorResponse): string {
    // 1. Errori di Rete (Server spento, assenza di internet, CORS)
    if (err.status === 0) {
      return 'Impossibile contattare il server. Controlla che il backend sia avviato.';
    }

    // 2. Errori Critici di Sistema (Crash del backend)
    if (err.status >= 500) {
      return 'Errore del server. Riprova tra poco.';
    }

    // 3. Errori di Business
    // Navighiamo in sicurezza nel payload del tuo backend: err.error?.error?.code
    const backendCode = err.error?.error?.code;

    if (backendCode && this.errorDictionary[backendCode]) {
      // Se il codice esiste nel nostro dizionario, restituiamo la traduzione
      return this.errorDictionary[backendCode];
    }

    // 4. Fallback: Proviamo a usare il messaggio del backend, altrimenti errore generico
    const backendMessage = err.error?.error?.message;
    return backendMessage || 'Si è verificato un errore imprevisto.';
  }
}
