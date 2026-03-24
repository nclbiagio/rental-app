import { Component, effect, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { PropertiesFacade } from '../properties.service';

@Component({
  selector: 'app-history-year-tab',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule, MatIconModule, MatDividerModule],
  template: `
    <div class="history-container p-4">
      @if (facade.yearlyHistoryResource.isLoading()) {
        <div class="flex-center p-12">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (facade.yearlyHistoryResource.error()) {
        <div class="error-banner rounded-md flex-items-center gap-2 p-4">
          <mat-icon>error_outline</mat-icon>
          <span>Ops! Impossibile caricare lo storico. Riprova più tardi.</span>
        </div>
      } @else if (facade.yearlyHistoryResource.value()?.data; as records) {
        <div class="history-grid mt-4">
          @for (record of records; track record.year) {
            <mat-card class="mat-elevation-z2 hover:mat-elevation-z4 transition-shadow">
              <mat-card-header class="pb-2 border-b">
                <mat-icon mat-card-avatar class="text-secondary">calendar_today</mat-icon>
                <mat-card-title class="text-xl">Anno {{ record.year }}</mat-card-title>
              </mat-card-header>

              <mat-card-content class="pt-4">
                <div class="data-row text-secondary">
                  <span>Entrate totali:</span>
                  <span>{{ record.totalIncome | currency: 'EUR' : 'symbol' : '1.2-2' }}</span>
                </div>

                <div class="data-row text-secondary">
                  <span>Uscite totali:</span>
                  <span class="text-loss"
                    >- {{ record.totalExpenses | currency: 'EUR' : 'symbol' : '1.2-2' }}</span
                  >
                </div>

                <mat-divider class="my-3"></mat-divider>

                <div class="data-row text-lg font-bold">
                  <span>Guadagno Netto:</span>
                  <span
                    [class.status-profit]="record.netIncome > 0"
                    [class.status-loss]="record.netIncome < 0"
                  >
                    {{ record.netIncome | currency: 'EUR' : 'symbol' : '1.2-2' }}
                  </span>
                </div>
              </mat-card-content>
            </mat-card>
          } @empty {
            <div class="empty-state p-12 text-secondary col-span-full">
              <mat-icon class="text-6xl mb-4 opacity-50">history_toggle_off</mat-icon>
              <h3 class="text-xl font-medium">Nessuno storico disponibile</h3>
              <p>I dati degli anni passati appariranno qui a partire dal prossimo anno.</p>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      /* Utility classes interne */
      .p-4 {
        padding: 1rem;
      }
      .p-12 {
        padding: 3rem;
      }
      .pt-4 {
        padding-top: 1rem;
      }
      .pb-2 {
        padding-bottom: 0.5rem;
      }
      .mt-4 {
        margin-top: 1rem;
      }
      .mb-2 {
        margin-bottom: 0.5rem;
      }
      .my-3 {
        margin-top: 0.75rem;
        margin-bottom: 0.75rem;
      }
      .gap-2 {
        gap: 0.5rem;
      }
      .rounded-md {
        border-radius: 0.375rem;
      }
      .font-bold {
        font-weight: 700;
      }
      .text-xl {
        font-size: 1.25rem;
      }
      .text-lg {
        font-size: 1.125rem;
      }
      .text-6xl {
        font-size: 3.75rem;
      }
      .opacity-50 {
        opacity: 0.5;
      }
      .border-b {
        border-bottom: 1px solid rgba(0, 0, 0, 0.12);
      }
      .transition-shadow {
        transition: box-shadow 280ms cubic-bezier(0.4, 0, 0.2, 1);
      }
      .text-secondary {
        color: rgba(0, 0, 0, 0.6);
      }

      /* Layout classes */
      .flex-center {
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .flex-items-center {
        display: flex;
        align-items: center;
      }
      .data-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;
      }

      /* Griglia Responsive */
      .history-grid {
        display: grid;
        grid-template-cols: 1fr;
        gap: 1rem;
      }

      @media (min-width: 768px) {
        .history-grid {
          grid-template-cols: repeat(2, 1fr);
        }
      }

      @media (min-width: 1024px) {
        .history-grid {
          grid-template-cols: repeat(3, 1fr);
        }
      }

      /* Stati specifici */
      .error-banner {
        background-color: #fef2f2;
        color: #dc2626;
        border: 1px solid #fee2e2;
      }
      .status-profit {
        color: #16a34a;
      } /* Verde corazzato */
      .status-loss,
      .text-loss {
        color: #dc2626;
      } /* Rosso corazzato */

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
      }
    `,
  ],
})
export class HistoryYearTabComponent {
  public facade = inject(PropertiesFacade);

  // Input reattivo (Signal)
  propId = input.required<string>();

  constructor() {
    // Aggiorniamo il Facade ogni volta che l'ID cambia
    effect(() => {
      this.facade.currentHistoryPropId.set(this.propId());
    });
  }
}
