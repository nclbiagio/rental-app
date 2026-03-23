import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ErrorBannerConfig {
  message: string;
  type: 'critical' | 'warning';
}

@Component({
  selector: 'app-global-error-banner',
  standalone: true,
  // 🚀 CommonModule rimosso completamente!
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (config()) {
      <div class="global-banner" [class]="config()?.type">
        <div class="banner-content">
          <mat-icon>{{ config()?.type === 'critical' ? 'report' : 'wifi_off' }}</mat-icon>
          <span class="message">{{ config()?.message }}</span>
        </div>
        <div class="banner-actions">
          @if (config()?.type === 'critical') {
            <button mat-button class="white-btn" (click)="reloadPage()">
              <mat-icon>refresh</mat-icon> Ricarica
            </button>
          } @else {
            <button mat-button class="white-btn" (click)="dismiss()">
              <mat-icon>close</mat-icon> Chiudi
            </button>
          }
        </div>
      </div>
    }
  `,
  styles: [
    `
      .global-banner {
        width: 100%;
        position: fixed;
        top: 0;
        left: 0;
        z-index: 10000;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 24px;
        color: white;
        font-weight: 500;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        box-sizing: border-box;
      }
      .critical {
        background-color: #d32f2f;
      }
      .warning {
        background-color: #fbc02d;
        color: #333;
      }
      .warning .white-btn {
        color: #333 !important;
      }

      .banner-content,
      .banner-actions {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .message {
        font-size: 1.1rem;
      }
      .white-btn {
        color: white !important;
        font-weight: bold;
        border: 1px solid currentColor !important;
      }
    `,
  ],
})
export class GlobalErrorBannerComponent {
  static errorConfig = signal<ErrorBannerConfig | null>(null);
  public config = GlobalErrorBannerComponent.errorConfig;

  static show(config: ErrorBannerConfig): void {
    this.errorConfig.set(config);
  }

  dismiss(): void {
    GlobalErrorBannerComponent.errorConfig.set(null);
  }

  reloadPage(): void {
    window.location.reload();
  }
}
