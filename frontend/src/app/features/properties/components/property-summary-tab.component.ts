import {
  Component,
  computed,
  effect,
  ElementRef,
  input,
  OnDestroy,
  viewChild,
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import Chart from 'chart.js/auto';
import type { PropertyStats } from '@app/shared/types/properties.contracts';
import type { ChartConfiguration, ChartOptions } from 'chart.js';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-property-summary-tab',
  standalone: true,
  imports: [CurrencyPipe, MatCardModule],
  template: `
    <div class="kpi-grid">
      <mat-card class="kpi-card">
        <mat-card-content>
          <div class="kpi-label">Media Mensile</div>
          <div class="kpi-value">
            {{ stats().allTimeAvg | currency: 'EUR' : 'symbol' : '1.0-0' }}
          </div>
          <div class="kpi-subtext">
            Ultimi 12 mesi: {{ stats().last12Avg | currency: 'EUR' : 'symbol' : '1.0-0' }}
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="kpi-card">
        <mat-card-content>
          <div class="kpi-label">YTD Netto ({{ currentYear }})</div>
          <div class="kpi-value primary-text">
            {{ stats().currentYearNetTotal | currency: 'EUR' : 'symbol' : '1.0-0' }}
          </div>
          <div class="kpi-subtext">
            Lordo Agenzia: {{ stats().currentYearTotal | currency: 'EUR' : 'symbol' : '1.0-0' }}
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="kpi-card">
        <mat-card-content>
          <div class="kpi-label">Mese Migliore</div>
          <div class="kpi-value best-text">
            @if (stats().bestMonth) {
              {{ stats().bestMonth!.amount | currency: 'EUR' : 'symbol' : '1.0-0' }}
            } @else {
              N/D
            }
          </div>
          <div class="kpi-subtext">
            @if (stats().bestMonth) {
              {{ stats().bestMonth!.month }} / {{ stats().bestMonth!.year }}
            } @else {
              -
            }
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="kpi-card">
        <mat-card-content>
          <div class="kpi-label">Mese Peggiore</div>
          <div class="kpi-value worst-text">
            @if (stats().worstMonth) {
              {{ stats().worstMonth!.amount | currency: 'EUR' : 'symbol' : '1.0-0' }}
            } @else {
              N/D
            }
          </div>
          <div class="kpi-subtext">
            @if (stats().worstMonth) {
              {{ stats().worstMonth!.month }} / {{ stats().worstMonth!.year }}
            } @else {
              -
            }
          </div>
        </mat-card-content>
      </mat-card>
    </div>

    <div class="chart-container">
      <mat-card class="chart-card">
        <mat-card-content>
          <div style="position: relative; height: 400px; width: 100%;">
            <canvas #chartCanvas></canvas>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 16px;
        margin-bottom: 32px;
      }
      .kpi-card {
        text-align: center;
        padding: 16px 0;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
      }
      .kpi-label {
        font-size: 0.85rem;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 8px;
        font-weight: 500;
      }
      .kpi-value {
        font-size: 2.2rem;
        font-weight: 700;
        color: #333;
        line-height: 1.2;
      }
      .primary-text {
        color: #1976d2;
      }
      .best-text {
        color: #2e7d32;
      }
      .worst-text {
        color: #d32f2f;
      }
      .kpi-subtext {
        font-size: 0.85rem;
        color: #888;
        margin-top: 8px;
        font-weight: 400;
      }
      .chart-container {
        margin-top: 32px;
        min-height: 400px;
      }
      .chart-container {
        margin-top: 32px;
      }
      .chart-card {
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
      }
      canvas {
        min-height: 400px;
        max-height: 400px;
        width: 100%;
      }
    `,
  ],
})
export class PropertySummaryTabComponent implements OnDestroy {
  // 📥 Riceve i dati dal Padre
  public stats = input.required<PropertyStats>();

  public currentYear = new Date().getFullYear();

  // 1. Catturiamo il canvas dall'HTML usando la nuova Signal API
  public chartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('chartCanvas');
  // 2. Teniamo traccia del grafico in memoria per poterlo aggiornare
  private chartInstance: Chart | null = null;

  // 🚀 OPZIONI DEL GRAFICO (Statiche)
  public chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          // Formatta i numeri nel tooltip come valuta
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('it-IT', {
                style: 'currency',
                currency: 'EUR',
              }).format(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
  };

  // 🚀 DATI DEL GRAFICO (Dinamici tramite computed signal)
  public chartData = computed<ChartConfiguration['data']>(() => {
    const data = this.stats();

    // 🚀 SICUREZZA: Se per qualche motivo i trend sono vuoti, non calcolare nulla
    if (!data || !data.monthlyTrend || data.monthlyTrend.length === 0) {
      return { labels: [], datasets: [] };
    }

    const trend = data.monthlyTrend;
    const avg = data.allTimeAvg;

    // 1. Etichette asse X (es. "1/2026", "2/2026")
    const labels = trend.map((m) => `${m.month}/${m.year}`);

    // 2. Colori dinamici per il Netto: Verde se > media, Rosso se < media
    const netColors = trend.map((m) => (m.netResult >= avg ? '#2e7d32' : '#d32f2f')); // Verde Material / Rosso Material

    // 3. Creiamo la linea tratteggiata per la media (lunga quanto tutti i mesi)
    const avgData = trend.map(() => avg);

    return {
      labels: labels,
      datasets: [
        {
          type: 'line', // <-- Questo lo fa diventare una linea!
          label: 'Media Storica',
          data: avgData,
          borderColor: '#ff9800', // Arancione per farla risaltare
          borderDash: [5, 5], // La rende tratteggiata!
          pointRadius: 0, // Nasconde i pallini sulla linea
          fill: false,
          order: 1, // Disegna la linea SOPRA le barre
        },
        {
          type: 'bar',
          label: 'Lordo Agenzia',
          data: trend.map((m) => m.agencyNetIncome),
          backgroundColor: '#bbdefb', // Azzurrino chiaro (non ruba l'attenzione)
          borderRadius: 4,
          order: 2,
        },
        {
          type: 'bar',
          label: 'Netto Effettivo',
          data: trend.map((m) => m.netResult),
          backgroundColor: netColors, // 🚀 Ecco la magia dei colori dinamici!
          borderRadius: 4,
          order: 3,
        },
      ],
    };
  });

  constructor() {
    // 🚀 L'EFFETTO MAGICO
    // Angular esegue questo blocco in automatico quando il Canvas è montato e i dati cambiano
    effect(() => {
      console.log(this.stats());
      const data = this.chartData();
      const canvasEl = this.chartCanvas()?.nativeElement;

      // 🚀 SPIA 1: Vediamo cosa ha in mano Angular in questo momento
      console.log('👀 Tentativo di disegno Chart.js:', {
        canvasTrovato: !!canvasEl,
        datiTrovati: data,
        numeroLabels: data?.labels?.length,
      });

      // Se non abbiamo ancora il canvas o i dati, ci fermiamo
      if (!canvasEl || !data || data.labels?.length === 0) return;

      console.log('✅ Tutto pronto! Disegno il grafico...');

      // Se il grafico esiste già, gli diamo i nuovi dati e fa l'animazione di aggiornamento
      if (this.chartInstance) {
        this.chartInstance.data = data as any;
        this.chartInstance.update();
      } else {
        // Altrimenti creiamo il grafico da zero usando le API ufficiali di Chart.js!
        this.chartInstance = new Chart(canvasEl, {
          type: 'bar',
          data: data as any,
          options: this.chartOptions,
        });
      }
    });
  }

  // 🧹 Pulizia: quando esci dalla pagina distruggiamo il grafico per liberare RAM
  ngOnDestroy() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  }
}
