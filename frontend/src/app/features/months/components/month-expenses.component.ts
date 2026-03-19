import { Component, effect, inject, input, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { ExpenseDialogComponent } from './expense-dialog.component';

import type { Expense, ExpensePayload, ExpenseCategory } from '@app/shared/types';

@Component({
  selector: 'app-month-expenses',
  standalone: true,
  imports: [CurrencyPipe, MatListModule, MatIconModule, MatButtonModule, MatTooltipModule],
  template: `
    @if (expenses().length === 0) {
      <div class="empty-expenses">
        <p>Nessuna spesa registrata per questo mese.</p>
      </div>
    } @else {
      <mat-list>
        @for (exp of expenses(); track exp.id) {
          <mat-list-item>
            <mat-icon matListItemIcon color="accent">receipt</mat-icon>
            <div matListItemTitle>
              {{ exp.ExpenseCategory?.name || 'Spesa Generica' }}
            </div>
            <div matListItemLine>
              {{ exp.description || 'Nessuna descrizione' }}
              <strong>({{ exp.amount | currency: 'EUR' : 'symbol' : '1.2-2' }})</strong>
            </div>

            <button
              mat-icon-button
              matListItemMeta
              color="warn"
              matTooltip="Rimuovi"
              (click)="delete.emit(exp.id)"
            >
              <mat-icon>delete</mat-icon>
            </button>
          </mat-list-item>
        }
      </mat-list>
    }

    <div class="add-expense-container" style="margin-top: 16px; text-align: center;">
      <button mat-stroked-button color="primary" (click)="openAddDialog()">
        <mat-icon>add</mat-icon> Aggiungi Spesa Extra
      </button>
    </div>
  `,
})
export class MonthExpensesComponent {
  private dialog = inject(MatDialog);

  // 📥 Dati in ingresso (dal componente Padre)
  public expenses = input.required<Expense[]>();
  public categories = input.required<ExpenseCategory[]>(); // Le categorie per la tendina

  // 📤 Eventi in uscita (verso il componente Padre)
  public add = output<ExpensePayload>();
  public delete = output<string>(); // Invia l'ID da cancellare

  constructor() {
    effect(() => {
      //console.log(this.expenses());
    });
  }

  public openAddDialog() {
    const dialogRef = this.dialog.open(ExpenseDialogComponent, {
      width: '400px',
      data: { categories: this.categories() }, // Passiamo le categorie al popup
    });

    dialogRef.afterClosed().subscribe((result: ExpensePayload | undefined) => {
      // Se l'utente ha compilato e salvato (non ha premuto Annulla)
      if (result) {
        this.add.emit(result); // Avvisa il padre!
      }
    });
  }
}
