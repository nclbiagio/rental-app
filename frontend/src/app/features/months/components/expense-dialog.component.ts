import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
// 🚀 Importa le tue utility del signal form
import { form, required, min, FormField } from '@angular/forms/signals';
import type { ExpenseCategory, ExpensePayload } from '@app/shared/types';

@Component({
  selector: 'app-expense-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormField,
  ],
  template: `
    <h2 mat-dialog-title>Aggiungi Spesa Extra</h2>

    <mat-dialog-content class="dialog-content">
      <form class="expense-form" (submit)="onSubmit()">
        <mat-form-field appearance="outline">
          <mat-label>Categoria *</mat-label>
          <mat-select [formField]="expenseForm.categoryId">
            @for (cat of categories; track cat.id) {
              <mat-option [value]="cat.id">{{ cat.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Importo (€) *</mat-label>
          <input matInput type="number" step="0.01" [formField]="expenseForm.amount" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Descrizione (Opzionale)</mat-label>
          <input matInput type="text" [formField]="descriptionField" />
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annulla</button>
      <button
        mat-flat-button
        color="primary"
        (click)="onSubmit()"
        [disabled]="!expenseForm().valid()"
      >
        Aggiungi
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-content {
        padding-top: 16px;
      }
      .expense-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
        min-width: 300px;
      }
    `,
  ],
})
export class ExpenseDialogComponent {
  private dialogRef = inject(MatDialogRef<ExpenseDialogComponent>);

  // Riceviamo le categorie dal componente che apre il dialog
  public categories: ExpenseCategory[] = inject(MAT_DIALOG_DATA).categories;

  public initialModel = signal<ExpensePayload>({
    categoryId: null,
    amount: 0,
    description: '',
  });

  public expenseForm = form(this.initialModel, (path) => {
    required(path.categoryId, { message: 'Scegli una categoria' });
    required(path.amount, { message: 'Inserisci un importo' });
    min(path.amount, 0.01, { message: 'Importo maggiore di zero' });
  });

  get descriptionField(): any {
    return this.expenseForm.description;
  }

  public onSubmit() {
    if (this.expenseForm().valid()) {
      // Chiudiamo il dialog restituendo i dati compilati!
      this.dialogRef.close(this.initialModel());
    }
  }
}
