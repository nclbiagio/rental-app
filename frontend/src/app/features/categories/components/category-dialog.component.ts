import { Component, inject, signal, effect } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

// 🚀 Le nuove API native di Angular 21 per i Signal Forms!
import { form, Field, required, min, FormField, applyWhenValue } from '@angular/forms/signals';

import type { CategoryPayload, ExpenseCategory } from '@app/shared/types/categories.contracts';

@Component({
  selector: 'app-category-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    FormField,
  ],
  template: `
    <h2 mat-dialog-title>{{ data?.category ? 'Modifica' : 'Nuova' }} Categoria</h2>

    <mat-dialog-content>
      <div class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nome Categoria</mat-label>
          <input
            matInput
            [formField]="categoryForm.name"
            placeholder="Es. Condominio, Utenze..."
            cdkFocusInitial
          />

          @if (categoryForm.name().errors().length && categoryForm.name().touched()) {
            <mat-error>{{ categoryForm.name().errors()[0].message }}</mat-error>
          }
        </mat-form-field>

        <div class="toggle-container">
          <mat-slide-toggle [formField]="isRecurringField" color="primary">
            È una spesa fissa ricorrente?
          </mat-slide-toggle>
        </div>

        @if (categoryModel().isRecurring) {
          <mat-form-field appearance="outline" class="full-width amount-field">
            <mat-label>Importo Fisso Mensile (€)</mat-label>
            <input matInput type="number" [formField]="recurringAmountField" placeholder="Es. 50" />

            @if (
              categoryForm.recurringAmount().errors().length &&
              categoryForm.recurringAmount().touched()
            ) {
              <mat-error>{{ categoryForm.recurringAmount().errors()[0].message }}</mat-error>
            }
          </mat-form-field>
        }
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Annulla</button>
      <button mat-flat-button color="primary" [disabled]="!categoryForm().valid()" (click)="save()">
        Salva
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding-top: 8px;
        min-width: 320px;
      }
      .full-width {
        width: 100%;
      }
      .toggle-container {
        padding: 8px 0;
      }
      .amount-field {
        margin-top: 8px;
      }
    `,
  ],
})
export class CategoryDialogComponent {
  public dialogRef = inject(MatDialogRef<CategoryDialogComponent>);
  public data = inject<{ category?: ExpenseCategory }>(MAT_DIALOG_DATA, { optional: true });

  // 1. 🎯 IL MODELLO DATI (Signal)
  public categoryModel = signal({
    name: this.data?.category?.name || '',
    isRecurring: this.data?.category?.isRecurring || false,
    recurringAmount: this.data?.category?.recurringAmount || null,
  });

  // 2. 🎯 LO SCHEMA DEL FORM NATIVO
  public categoryForm = form(this.categoryModel, (path) => {
    required(path.name, { message: 'Il nome della categoria è obbligatorio' });

    // 🚀 VALIDAZIONE CONDIZIONALE: Sfruttiamo 'when' nativo di Angular 21!
    required(path.recurringAmount, {
      message: "Inserisci l'importo della spesa fissa",
      when: ({ valueOf }) => valueOf(path.isRecurring) === true,
    });

    applyWhenValue(
      path,
      (p) => p.isRecurring === true,
      (category) => {
        min(category.recurringAmount, 0, {
          message: "L'importo non può essere negativo",
        });
      },
    );
  });

  constructor() {
    // 3. 🧹 PULIZIA DEI DATI
    // Se l'utente spegne l'interruttore "isRecurring", azzeriamo fisicamente l'importo
    // nel modello per evitare di inviare dati "sporchi" al backend.
    effect(() => {
      const isRecurring = this.categoryModel().isRecurring;
      const currentAmount = this.categoryModel().recurringAmount;

      if (!isRecurring && currentAmount !== null) {
        this.categoryModel.update((model) => ({ ...model, recurringAmount: null }));
      }
    });
  }

  save() {
    if (this.categoryForm().valid()) {
      // Passiamo il modello finale pulito e validato al padre
      const payload: CategoryPayload = this.categoryModel();
      this.dialogRef.close(payload);
    }
  }

  get recurringAmountField(): any {
    return this.categoryForm.recurringAmount;
  }

  get isRecurringField(): any {
    return this.categoryForm.isRecurring;
  }
}
