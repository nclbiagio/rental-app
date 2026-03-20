import { Component, inject, signal } from '@angular/core';

// 🚀 IMPORTIAMO I VALIDATORI NATIVI DI ANGULAR 21
import { form, FormField, required, maxLength, validate } from '@angular/forms/signals';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PropertiesFacade } from './properties.service';

@Component({
  selector: 'app-property-create',
  standalone: true,
  imports: [
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
  ],
  template: `
    <div class="form-wrapper">
      <header class="page-header">
        <button mat-icon-button (click)="goBack()"><mat-icon>arrow_back</mat-icon></button>
        <h1>Aggiungi Immobile</h1>
      </header>

      <form class="property-form" (submit)="onSubmit($event)">
        <mat-form-field appearance="outline">
          <mat-label>Nome Immobile *</mat-label>
          <input matInput type="text" [formField]="propertyForm.name" />

          @if (propertyForm.name().errors().length && propertyForm.name().touched()) {
            <mat-error>{{ propertyForm.name().errors()[0].message }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Indirizzo (Opzionale)</mat-label>
          <input matInput type="text" [formField]="propertyForm.address" />

          @if (propertyForm.address().errors().length && propertyForm.address().touched()) {
            <mat-error>{{ propertyForm.address().errors()[0].message }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Data di inizio rendicontazione *</mat-label>
          <input
            matInput
            [matDatepicker]="picker"
            [formField]="propertyForm.startDate"
            (dateChange)="onDateChange($event.value)"
          />
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>

          @if (propertyForm.startDate().errors().length && propertyForm.startDate().touched()) {
            <mat-error>{{ propertyForm.startDate().errors()[0].message }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Note (Opzionale)</mat-label>
          <textarea matInput rows="4" [formField]="propertyForm.notes"></textarea>
        </mat-form-field>

        <div class="form-actions">
          <button mat-button type="button" (click)="goBack()">Annulla</button>

          <button
            mat-flat-button
            color="primary"
            type="submit"
            [disabled]="propertyForm().invalid()"
          >
            Salva Immobile
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .form-wrapper {
        max-width: 600px;
        margin: 32px auto;
        padding: 0 16px;
      }
      .page-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 32px;
      }
      .page-header h1 {
        margin: 0;
        font-size: 24px;
        color: #2c3e50;
      }
      .property-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      mat-form-field {
        width: 100%;
      }
      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 16px;
        margin-top: 16px;
      }
    `,
  ],
})
export class PropertyCreateComponent {
  private facade = inject(PropertiesFacade);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  public initialModel = signal({
    name: '',
    address: '',
    notes: '',
    startDate: '',
  });

  // 🎯 IL NUOVO MODO: Passiamo una funzione schema come secondo argomento!
  public propertyForm = form(this.initialModel, (path) => {
    // Validatori nativi configurabili con messaggi custom
    required(path.name, { message: 'Il nome è obbligatorio' });
    maxLength(path.name, 100, { message: 'Il nome è troppo lungo (max 100 char)' });

    maxLength(path.address, 255, { message: "L'indirizzo è troppo lungo (max 255 char)" });

    required(path.startDate, { message: 'La data di inizio è obbligatoria' });

    // Validatore CUSTOM super pulito per la data
    validate(path.startDate, (ctx) => {
      const val = ctx.value();
      // Se è vuoto (lo gestisce il 'required') o se è una data valida, tutto ok (null)
      if (!val || !isNaN(Date.parse(val))) return null;

      // Altrimenti ritorniamo l'oggetto di errore
      return { kind: 'invalidDate', message: 'Data di inizio non valida' };
    });
  });

  public onDateChange(date: Date | null): void {
    if (date) {
      // 🚀 Estraiamo i valori LOCALI ignorando il fuso orario UTC
      const year = date.getFullYear();
      // getMonth() parte da 0 (Gennaio = 0), quindi aggiungiamo 1.
      // padStart(2, '0') aggiunge lo zero davanti ai numeri da 1 a 9.
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      const localIsoDate = `${year}-${month}-${day}`;

      this.initialModel.update((m) => ({ ...m, startDate: localIsoDate }));
    } else {
      this.initialModel.update((m) => ({ ...m, startDate: '' }));
    }
  }

  public async onSubmit(event: Event): Promise<void> {
    event.preventDefault();

    // Per risolvere l'errore che avevi prima: il form root va chiamato come una funzione
    // per leggere il suo stato globale ( propertyForm().valid() )
    if (this.propertyForm().valid()) {
      try {
        const payload = this.initialModel();
        await this.facade.createProperty(payload);

        this.snackBar.open('Immobile salvato con successo!', 'Chiudi', {
          duration: 3000, // Scompare da solo dopo 3 secondi
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });

        this.router.navigate(['/dashboard']);
      } catch (error) {
        console.error('Errore durante la creazione:', error);

        // Feedback in caso di errore (es. il backend va giù)
        this.snackBar.open('Errore di salvataggio. Riprova più tardi.', 'Chiudi', {
          duration: 5000,
        });
      }
    }
  }

  public goBack(): void {
    window.history.back();
  }
}
