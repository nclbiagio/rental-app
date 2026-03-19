import { Component, inject, input, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CategoriesFacade } from '../../categories/categories.service';
import type { ExpenseCategory } from '@app/shared/types/categories.contracts';
import { CategoryDialogComponent } from '../../categories/components/category-dialog.component';

@Component({
  selector: 'app-property-categories-tab',
  standalone: true,
  imports: [
    CurrencyPipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="tab-container">
      <div class="actions-header">
        <h3>Configurazione Spese</h3>
        <button mat-flat-button color="primary" (click)="openDialog()">
          <mat-icon>add</mat-icon> Nuova Categoria
        </button>
      </div>

      <div class="table-card mat-elevation-z2">
        @if (isLoading()) {
          <div class="loading-state">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
        } @else {
          <table mat-table [dataSource]="categories()">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Nome Categoria</th>
              <td mat-cell *matCellDef="let cat" class="fw-500">{{ cat.name }}</td>
            </ng-container>

            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Tipologia</th>
              <td mat-cell *matCellDef="let cat">
                @if (cat.isRecurring) {
                  <mat-chip-set>
                    <mat-chip class="recurring-chip" highlighted>Ricorrente</mat-chip>
                  </mat-chip-set>
                } @else {
                  <span class="text-muted">Variabile</span>
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef>Importo Fisso</th>
              <td mat-cell *matCellDef="let cat" class="fw-500">
                @if (cat.isRecurring && cat.recurringAmount) {
                  {{ cat.recurringAmount | currency: 'EUR' : 'symbol' : '1.2-2' }}
                } @else {
                  -
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="text-right">Azioni</th>
              <td mat-cell *matCellDef="let cat" class="text-right">
                <button mat-icon-button color="primary" (click)="openDialog(cat)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="deleteCategory(cat.id)">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>

            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell empty-state" [attr.colspan]="4">
                Nessuna categoria configurata per questo immobile.
              </td>
            </tr>
          </table>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .tab-container {
        margin-top: 16px;
        padding-bottom: 32px;
      }
      .actions-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      .table-card {
        border-radius: 12px;
        overflow: hidden;
        background: white;
        min-height: 200px;
      }
      table {
        width: 100%;
      }
      .fw-500 {
        font-weight: 500;
      }
      .text-muted {
        color: #888;
      }
      .text-right {
        text-align: right;
      }
      .empty-state,
      .loading-state {
        text-align: center;
        padding: 32px;
        color: #666;
        font-style: italic;
        display: flex;
        justify-content: center;
      }
      ::ng-deep .recurring-chip {
        background-color: #e3f2fd !important;
        color: #1976d2 !important;
      }
    `,
  ],
})
export class PropertyCategoriesTabComponent implements OnInit {
  public propId = input.required<string>();

  private facade = inject(CategoriesFacade);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  public displayedColumns = ['name', 'type', 'amount', 'actions'];

  // Stati gestiti con Signal standard
  public categories = signal<ExpenseCategory[]>([]);
  public isLoading = signal<boolean>(true);

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.isLoading.set(true);
    try {
      const data = await this.facade.getCategories(this.propId());
      this.categories.set(data);
    } catch (error) {
      this.snackBar.open('Errore nel caricamento categorie', 'OK', { duration: 3000 });
    } finally {
      this.isLoading.set(false);
    }
  }

  async openDialog(category?: ExpenseCategory) {
    const dialogRef = this.dialog.open(CategoryDialogComponent, {
      width: '400px',
      data: { category },
    });

    const result = await dialogRef.afterClosed().toPromise();
    if (result) {
      try {
        if (category) {
          await this.facade.updateCategory(this.propId(), category.id, result);
          this.snackBar.open('Categoria aggiornata', 'OK', { duration: 3000 });
        } else {
          await this.facade.createCategory(this.propId(), result);
          this.snackBar.open('Categoria creata', 'OK', { duration: 3000 });
        }
        // Ricarichiamo la tabella
        await this.loadData();
      } catch (error) {
        this.snackBar.open('Errore nel salvataggio', 'OK', { duration: 3000 });
      }
    }
  }

  async deleteCategory(categoryId: string) {
    if (confirm('Sei sicuro di voler eliminare questa categoria?')) {
      try {
        await this.facade.deleteCategory(this.propId(), categoryId);
        this.snackBar.open('Categoria eliminata', 'OK', { duration: 3000 });
        await this.loadData();
      } catch (error) {
        this.snackBar.open('Impossibile eliminare. Forse è usata in qualche spesa?', 'OK', {
          duration: 4000,
        });
      }
    }
  }
}
