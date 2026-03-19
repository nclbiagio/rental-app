import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';

// Material Imports
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { PropertiesFacade } from './properties.service';
import { PropertySummaryTabComponent } from './components/property-summary-tab.component';
import { PropertyHistoryTabComponent } from './components/property-history-tab.component';
import { PropertyExpensesTabComponent } from './components/property-expenses-tab.component';
import { PropertyCategoriesTabComponent } from './components/property-categories-tab.component';

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [
    RouterLink,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PropertySummaryTabComponent,
    PropertyHistoryTabComponent,
    PropertyExpensesTabComponent,
    PropertyCategoriesTabComponent,
  ],
  template: `
    <div class="page-container">
      <header class="page-header">
        <button mat-icon-button routerLink="/dashboard"><mat-icon>arrow_back</mat-icon></button>
        <h1>Dettaglio Immobile</h1>
        <span class="spacer"></span>
        <button
          mat-flat-button
          color="primary"
          [routerLink]="['/properties', propId(), 'months', 'new']"
        >
          <mat-icon>add</mat-icon> Aggiungi Mese
        </button>
      </header>

      @if (statsResource.isLoading()) {
        <div class="loading-state">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Caricamento statistiche in corso...</p>
        </div>
      } @else if (statsResource.error()) {
        <div class="error-state">
          <mat-icon color="warn">error</mat-icon>
          <p>Errore nel caricamento dei dati.</p>
        </div>
      } @else if (statsResource.value()?.data; as stats) {
        <mat-tab-group animationDuration="0ms" class="stats-tabs">
          <mat-tab label="Riepilogo & KPI">
            <div class="tab-content">
              <app-property-summary-tab [stats]="stats" />
            </div>
          </mat-tab>

          <mat-tab label="Storico Mesi">
            <div class="tab-content">
              <app-property-history-tab
                [trends]="stats.monthlyTrend"
                [avg]="stats.allTimeAvg"
                [propId]="propId()"
              >
              </app-property-history-tab>
            </div>
          </mat-tab>

          <mat-tab label="Spese per Categoria">
            <div class="tab-content">
              <app-property-expenses-tab [expenses]="stats.expensesByCategory">
              </app-property-expenses-tab>
            </div>
          </mat-tab>

          <mat-tab label="Categorie & Spese Fisse">
            <div class="tab-content">
              <app-property-categories-tab [propId]="propId()"></app-property-categories-tab>
            </div>
          </mat-tab>
        </mat-tab-group>
      }
    </div>
  `,
  styles: [
    `
      .page-container {
        padding: 24px;
        max-width: 1200px;
        margin: 0 auto;
      }
      .page-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 24px;
      }
      .spacer {
        flex: 1;
      }
      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-top: 50px;
      }
      .tab-content {
        padding: 24px 0;
      }
    `,
  ],
})
export class PropertyDetailComponent {
  private facade = inject(PropertiesFacade);

  // Inietto l'ID dalla rotta (/properties/:propId)
  public propId = input.required<string>();

  // 2. 🚀 INIZIALIZZAZIONE DELLA RISORSA
  // Passiamo this.propId (che è un Signal, quindi è già una funzione esecutiva)
  // al metodo del Facade. Quando il componente si avvia, la chiamata parte da sola!
  public statsResource = this.facade.getStatsResource(this.propId);
}
