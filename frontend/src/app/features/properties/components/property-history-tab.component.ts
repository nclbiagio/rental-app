import { Component, input, effect, viewChild } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

// Material
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

import type { MonthlyTrendStat } from '@app/shared/types/properties.contracts';

@Component({
  selector: 'app-property-history-tab',
  standalone: true,
  imports: [
    CurrencyPipe,
    RouterLink,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  template: `
    <div class="tab-container">
      <div class="table-card mat-elevation-z2">
        <table mat-table [dataSource]="dataSource">
          <ng-container matColumnDef="monthYear">
            <th mat-header-cell *matHeaderCellDef>Mese/Anno</th>
            <td mat-cell *matCellDef="let row" class="fw-500">
              {{ getMonthName(row.month) }} {{ row.year }}
            </td>
          </ng-container>

          <ng-container matColumnDef="agencyNetIncome">
            <th mat-header-cell *matHeaderCellDef>Lordo Agenzia</th>
            <td mat-cell *matCellDef="let row">
              {{ row.agencyNetIncome | currency: 'EUR' : 'symbol' : '1.2-2' }}
            </td>
          </ng-container>

          <ng-container matColumnDef="totalExpenses">
            <th mat-header-cell *matHeaderCellDef>Spese Totali</th>
            <td mat-cell *matCellDef="let row" class="text-warn">
              {{ row.totalExpenses > 0 ? '-' : ''
              }}{{ row.totalExpenses | currency: 'EUR' : 'symbol' : '1.2-2' }}
            </td>
          </ng-container>

          <ng-container matColumnDef="netResult">
            <th mat-header-cell *matHeaderCellDef>Netto Effettivo</th>
            <td mat-cell *matCellDef="let row">
              <span
                class="net-badge"
                [class.bg-success]="row.netResult >= avg()"
                [class.bg-danger]="row.netResult < avg()"
              >
                {{ row.netResult | currency: 'EUR' : 'symbol' : '1.2-2' }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="delta">
            <th mat-header-cell *matHeaderCellDef>Δ Media</th>
            <td mat-cell *matCellDef="let row">
              @let diff = row.netResult - avg();

              <div
                class="delta-cell"
                [class.positive]="diff > 0"
                [class.negative]="diff < 0"
                [class.neutral]="diff === 0"
              >
                @if (diff > 0) {
                  <mat-icon>trending_up</mat-icon>
                } @else if (diff < 0) {
                  <mat-icon>trending_down</mat-icon>
                } @else {
                  <mat-icon>horizontal_rule</mat-icon>
                }

                <span>{{ getAbs(diff) | currency: 'EUR' : 'symbol' : '1.0-0' }}</span>
              </div>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>

          <tr
            mat-row
            *matRowDef="let row; columns: displayedColumns"
            class="clickable-row"
            [routerLink]="['/properties', propId(), 'months', row.id]"
          ></tr>

          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell no-data-cell" [attr.colspan]="displayedColumns.length">
              Nessun mese registrato. Clicca sul pulsante + per iniziare.
            </td>
          </tr>
        </table>

        <mat-paginator [pageSizeOptions]="[10, 25, 50]" showFirstLastButtons></mat-paginator>
      </div>

      <button
        mat-fab
        color="primary"
        class="fab-add"
        matTooltip="Aggiungi nuovo mese"
        [routerLink]="['/properties', propId(), 'months', 'new']"
      >
        <mat-icon>add</mat-icon>
      </button>
    </div>
  `,
  styles: [
    `
      .tab-container {
        position: relative;
        padding-bottom: 80px;
        margin-top: 16px;
      }
      .table-card {
        border-radius: 12px;
        overflow: hidden;
        background: white;
      }

      table {
        width: 100%;
      }
      .fw-500 {
        font-weight: 500;
      }
      .text-warn {
        color: #d32f2f;
      }

      .net-badge {
        padding: 4px 8px;
        border-radius: 4px;
        font-weight: 600;
        color: white;
      }
      .bg-success {
        background-color: #2e7d32;
      }
      .bg-danger {
        background-color: #d32f2f;
      }

      .delta-cell {
        display: flex;
        align-items: center;
        gap: 4px;
        font-weight: 500;
      }
      .delta-cell mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
      .delta-cell.positive {
        color: #2e7d32;
      }
      .delta-cell.negative {
        color: #d32f2f;
      }
      .delta-cell.neutral {
        color: #757575;
      }

      /* Hover sulla riga */
      .clickable-row {
        cursor: pointer;
        transition: background-color 0.2s;
      }
      .clickable-row:hover {
        background-color: #f5f5f5;
      }

      .no-data-cell {
        text-align: center;
        padding: 32px;
        color: #666;
        font-style: italic;
      }

      /* Posizionamento del FAB */
      .fab-add {
        position: absolute;
        bottom: 16px;
        right: 16px;
        z-index: 10;
      }
    `,
  ],
})
export class PropertyHistoryTabComponent {
  // 📥 Input dal Padre
  public trends = input.required<MonthlyTrendStat[]>();
  public avg = input.required<number>();
  public propId = input.required<string>();

  // 🔎 Riferimento al paginatore HTML
  public paginator = viewChild(MatPaginator);

  // 🗃️ Dati per la Material Table
  public dataSource = new MatTableDataSource<MonthlyTrendStat>([]);
  public displayedColumns = ['monthYear', 'agencyNetIncome', 'totalExpenses', 'netResult', 'delta'];

  private readonly monthNames = [
    'Gennaio',
    'Febbraio',
    'Marzo',
    'Aprile',
    'Maggio',
    'Giugno',
    'Luglio',
    'Agosto',
    'Settembre',
    'Ottobre',
    'Novembre',
    'Dicembre',
  ];

  constructor() {
    // 🚀 L'effetto collega i Signal di Angular alla logica imperativa della MatTable
    effect(() => {
      // 1. Aggiorna i dati
      this.dataSource.data = this.trends();

      // 2. Collega il paginatore appena è disponibile nel DOM
      const pag = this.paginator();
      if (pag && !this.dataSource.paginator) {
        this.dataSource.paginator = pag;
      }
    });
  }

  // Utility per il template
  public getMonthName(month: number): string {
    return this.monthNames[month - 1] || 'Sconosciuto';
  }

  public getAbs(val: number): number {
    return Math.abs(val);
  }
}
