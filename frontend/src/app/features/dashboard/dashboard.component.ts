import { Component, inject } from '@angular/core';
import { CurrencyPipe, JsonPipe } from '@angular/common';

// Angular Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { DashboardFacade } from './dashboard.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CurrencyPipe,
    MatCardModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    RouterLink,
  ],
  template: `
    <div class="dashboard-container">
      @if (facade.dashboardResource.isLoading()) {
        <div class="loading-state">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Caricamento portafoglio...</p>
        </div>
      } @else {
        @if (facade.properties().length === 0) {
          <div class="empty-state">
            <mat-icon color="primary" class="empty-icon">domain_disabled</mat-icon>
            <h2>Nessun immobile trovato</h2>
            <p>Non hai ancora inserito nessuna proprietà nel tuo portafoglio.</p>
            <button mat-flat-button color="primary" routerLink="/property/new">
              Aggiungi Immobile
            </button>
          </div>
        } @else {
          <mat-card class="total-card">
            <mat-card-header>
              <mat-card-title-group>
                <mat-card-title>Totale Portafoglio (YTD)</mat-card-title>
                <mat-card-subtitle>Somma netta accantonata da inizio anno</mat-card-subtitle>
                <button mat-flat-button color="primary" routerLink="/property/new">
                  <mat-icon>add</mat-icon>
                  Nuovo
                </button>
              </mat-card-title-group>
            </mat-card-header>
            <mat-card-content>
              <div class="total-value">
                {{ facade.totalPortfolioYtd() | currency: 'EUR' : 'symbol' : '1.0-0' }}
              </div>
            </mat-card-content>
          </mat-card>

          <div class="properties-grid">
            @for (prop of facade.properties(); track prop.propertyId) {
              <mat-card class="property-card">
                <mat-card-header>
                  <mat-card-title>
                    {{ prop.propertyName }}
                    <span style="font-size: 12px; color: #666">{{ prop.startDate }}</span>
                  </mat-card-title>
                </mat-card-header>

                <mat-card-content>
                  <div class="stats-row">
                    <span class="label">Ultimo Mese:</span>
                    <span
                      class="value"
                      [style.color]="
                        prop.lastMonthNetResult >= prop.avgMonthly ? '#4caf50' : '#f44336'
                      "
                    >
                      {{ prop.lastMonthNetResult | currency: 'EUR' }}
                      <mat-icon inline>
                        {{
                          prop.lastMonthNetResult >= prop.avgMonthly
                            ? 'trending_up'
                            : 'trending_down'
                        }}
                      </mat-icon>
                    </span>
                  </div>

                  <div class="stats-row">
                    <span class="label">YTD Netto:</span>
                    <span class="value">{{ prop.ytdNetResult | currency: 'EUR' }}</span>
                  </div>

                  <div class="stats-row">
                    <span class="label">Media Mensile:</span>
                    <span class="value">{{ prop.avgMonthly | currency: 'EUR' }}</span>
                  </div>
                </mat-card-content>

                <mat-card-actions class="card-actions">
                  @if (prop.missingMonths.length > 0) {
                    <mat-chip class="warning-chip" highlighted>
                      <mat-icon matChipAvatar>warning</mat-icon>
                      {{ prop.missingMonths.length }} mesi da compilare
                    </mat-chip>
                    <button
                      mat-button
                      color="accent"
                      [routerLink]="['/properties', prop.propertyId]"
                    >
                      Compila ora
                    </button>
                  } @else {
                    <mat-chip class="success-chip">
                      <mat-icon matChipAvatar>check_circle</mat-icon>
                      Tutto aggiornato
                    </mat-chip>
                  }
                </mat-card-actions>
              </mat-card>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
      .dashboard-container {
        padding: 24px;
        max-width: 1200px;
        margin: 0 auto;
      }

      /* Stili Loading ed Empty State */
      .loading-state,
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 50vh;
        text-align: center;
        gap: 16px;
      }

      .empty-icon {
        font-size: 64px;
        height: 64px;
        width: 64px;
        opacity: 0.5;
      }

      /* Stili Card Totale */
      .total-card {
        margin-bottom: 32px;
        background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
        text-align: center;

        .total-value {
          font-size: 48px;
          font-weight: bold;
          color: #2c3e50;
          margin-top: 16px;
          margin-bottom: 16px;
        }
      }

      /* Griglia degli Immobili */
      .properties-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 24px;
      }

      .property-card {
        display: flex;
        flex-direction: column;
        transition:
          transform 0.2s ease-in-out,
          box-shadow 0.2s ease-in-out;

        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        }
      }

      /* Layout interno alla card */
      .stats-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #f0f0f0;

        &:last-child {
          border-bottom: none;
        }

        .label {
          color: #666;
          font-size: 14px;
        }

        .value {
          font-weight: 500;
          font-size: 16px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }

      .card-actions {
        margin-top: auto; /* Spinge le action in basso se le card hanno altezze diverse */
        padding: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      /* Chips personalizzate */
      .warning-chip {
        background-color: #ff9800 !important;
        color: white !important;
      }

      .success-chip {
        background-color: #e8f5e9 !important;
        color: #2e7d32 !important;
      }
    `,
  ],
})
export class DashboardComponent {
  // Iniettiamo il nostro Facade
  public facade = inject(DashboardFacade);
}
