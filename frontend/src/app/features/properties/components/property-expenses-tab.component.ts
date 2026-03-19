import {
  Component,
  input,
  computed,
  effect,
  viewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';

// Material
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';

// Chart.js nativo
import Chart from 'chart.js/auto';
import type { ChartConfiguration, ChartOptions } from 'chart.js';

import type { ExpenseCategoryStat } from '@app/shared/types/properties.contracts';

@Component({
  selector: 'app-property-expenses-tab',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe, MatCardModule, MatTableModule],
  template: `
    <div class="expenses-layout">
      <mat-card class="chart-card mat-elevation-z2">
        <mat-card-header>
          <mat-card-title>Distribuzione Spese</mat-card-title>
        </mat-card-header>
        <mat-card-content class="chart-content">
          @if (expenses().length > 0) {
            <div class="canvas-container">
              <canvas #pieChartCanvas></canvas>
            </div>
          } @else {
            <div class="empty-state">Nessuna spesa registrata per questo immobile.</div>
          }
        </mat-card-content>
      </mat-card>

      <mat-card class="table-card mat-elevation-z2">
        <table mat-table [dataSource]="dataSource">
          <ng-container matColumnDef="categoryName">
            <th mat-header-cell *matHeaderCellDef>Categoria</th>
            <td mat-cell *matCellDef="let row" class="fw-500">
              <span class="color-dot" [style.backgroundColor]="getColor(row.categoryName)"></span>
              {{ row.categoryName }}
            </td>
          </ng-container>

          <ng-container matColumnDef="total">
            <th mat-header-cell *matHeaderCellDef class="text-right">Totale</th>
            <td mat-cell *matCellDef="let row" class="text-right fw-500">
              {{ row.total | currency: 'EUR' : 'symbol' : '1.2-2' }}
            </td>
          </ng-container>

          <ng-container matColumnDef="percentage">
            <th mat-header-cell *matHeaderCellDef class="text-right">%</th>
            <td mat-cell *matCellDef="let row" class="text-right text-muted">
              {{ row.percentage | number: '1.1-1' }}%
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>

          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell empty-state" [attr.colspan]="3">Nessun dato disponibile</td>
          </tr>
        </table>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .expenses-layout {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        margin-top: 16px;
        align-items: start;
      }

      /* Su schermi piccoli, metti la tabella sotto il grafico */
      @media (max-width: 768px) {
        .expenses-layout {
          grid-template-columns: 1fr;
        }
      }

      .chart-card,
      .table-card {
        border-radius: 12px;
      }
      mat-card-title {
        font-size: 1.1rem;
        margin-bottom: 16px;
        color: #333;
      }

      .chart-content {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 300px;
        padding: 16px;
      }
      .canvas-container {
        position: relative;
        height: 300px;
        width: 100%;
      }

      table {
        width: 100%;
      }
      .text-right {
        text-align: right;
        justify-content: flex-end;
      }
      .fw-500 {
        font-weight: 500;
      }
      .text-muted {
        color: #666;
      }

      .color-dot {
        display: inline-block;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        margin-right: 8px;
        vertical-align: middle;
      }

      .empty-state {
        text-align: center;
        color: #888;
        padding: 32px;
        font-style: italic;
        width: 100%;
      }
    `,
  ],
})
export class PropertyExpensesTabComponent implements OnDestroy {
  // 📥 Input dal Padre
  public expenses = input.required<ExpenseCategoryStat[]>();

  // Riferimento al canvas e istanza di Chart.js
  public chartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('pieChartCanvas');
  private chartInstance: Chart<'doughnut'> | null = null;

  // Dati per la tabella
  public dataSource = new MatTableDataSource<ExpenseCategoryStat>([]);
  public displayedColumns = ['categoryName', 'total', 'percentage'];

  // Palette di colori Material per le categorie
  private readonly colorPalette = [
    '#e53935',
    '#1e88e5',
    '#43a047',
    '#fb8c00',
    '#8e24aa',
    '#00acc1',
    '#fdd835',
    '#6d4c41',
    '#3949ab',
    '#c0ca33',
  ];

  // Mappa per garantire che una categoria abbia sempre lo stesso colore in tabella e nel grafico
  private colorMap = new Map<string, string>();

  // Calcolo dei dati per il grafico
  public chartData = computed<ChartConfiguration['data']>(() => {
    const data = this.expenses();
    this.dataSource.data = data; // Aggiorna la tabella contestualmente

    if (!data || data.length === 0) return { labels: [], datasets: [] };

    // Assegna colori univoci alle categorie
    const bgColors = data.map((exp, index) => {
      if (!this.colorMap.has(exp.categoryName)) {
        this.colorMap.set(exp.categoryName, this.colorPalette[index % this.colorPalette.length]);
      }
      return this.colorMap.get(exp.categoryName)!;
    });

    return {
      labels: data.map((e) => e.categoryName),
      datasets: [
        {
          data: data.map((e) => e.total),
          backgroundColor: bgColors,
          borderWidth: 2,
          borderColor: '#ffffff',
        },
      ],
    };
  });

  constructor() {
    effect(() => {
      const data = this.chartData();
      const canvasEl = this.chartCanvas()?.nativeElement;

      if (!canvasEl || !data || data.labels?.length === 0) return;

      if (this.chartInstance) {
        this.chartInstance.data = data as any;
        this.chartInstance.update();
      } else {
        this.chartInstance = new Chart(canvasEl, {
          type: 'doughnut',
          data: data as any,
          // 🚀 AGGIUNGIAMO IL CAST AL TIPO CORRETTO QUI SOTTO:
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
              legend: { position: 'right' },
              tooltip: {
                callbacks: {
                  label: (context: any) => {
                    // 🚀 Aggiungi ': any' anche a context per sicurezza
                    const value = context.parsed;
                    return (
                      ' ' +
                      new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(
                        value,
                      )
                    );
                  },
                },
              },
            },
          } as ChartOptions<'doughnut'>, // <--- LA MAGIA È QUI
        });
      }
    });
  }

  // Utility per il template (pallini colorati della tabella)
  public getColor(categoryName: string): string {
    return this.colorMap.get(categoryName) || '#ccc';
  }

  ngOnDestroy() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  }
}
