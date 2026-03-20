import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router'; // 🚀 Importiamo il Router
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-dev-db-manager',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="dev-container">
      <mat-card class="dev-card mat-elevation-z4">
        <h2>🛠️ Time Machine DB</h2>
        <p class="text-muted">
          Strumento di sviluppo per fare snapshot e ripristinare il database SQLite locale.
        </p>

        <div class="action-section">
          <button mat-flat-button color="primary" (click)="createBackup()">
            📸 Crea Snapshot (Backup)
          </button>
        </div>

        <hr class="divider" />

        <div class="action-section restore-section">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Seleziona un backup da ripristinare</mat-label>
            <mat-select [(ngModel)]="selectedFile">
              @for (file of backups(); track file) {
                <mat-option [value]="file">{{ file }}</mat-option>
              }
              @if (backups().length === 0) {
                <mat-option disabled>Nessun backup trovato</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <button
            mat-flat-button
            color="warn"
            class="restore-btn"
            [disabled]="!selectedFile() || isRestoring()"
            (click)="restoreBackup()"
          >
            @if (isRestoring()) {
              <div style="display: flex; align-items: center; gap: 8px">
                <mat-spinner diameter="20" color="warn"></mat-spinner>
                <span>Riavvio server in corso...</span>
              </div>
            } @else {
              <span>⚠️ Ripristina (Sovrascrive DB)</span>
            }
          </button>
        </div>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .dev-container {
        padding: 40px;
        display: flex;
        justify-content: center;
      }
      .dev-card {
        width: 100%;
        max-width: 500px;
        padding: 24px;
      }
      .text-muted {
        color: #666;
        font-size: 0.9rem;
        margin-bottom: 24px;
      }
      .action-section {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin: 16px 0;
      }
      .divider {
        border: 0;
        border-top: 1px solid #eee;
        margin: 24px 0;
      }
      .full-width {
        width: 100%;
      }
    `,
  ],
})
export class DevDbManagerComponent {
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private baseUrl = `${environment.apiUrl}/dev/db`;

  public backups = signal<string[]>([]);
  public selectedFile = signal<string | null>(null);
  public isRestoring = signal<boolean>(false);

  constructor() {
    this.loadBackups();
  }

  loadBackups() {
    this.http.get<any>(`${this.baseUrl}/backups`).subscribe({
      next: (res) => this.backups.set(res.data),
      error: () => this.snackBar.open('Errore caricamento backup', 'OK'),
    });
  }

  createBackup() {
    this.http.post<any>(`${this.baseUrl}/backup`, {}).subscribe({
      next: (res) => {
        this.snackBar.open(res.data.message, 'OK', { duration: 3000 });
        this.loadBackups(); // Ricarica la tendina
      },
      error: () => this.snackBar.open('Errore creazione backup', 'OK'),
    });
  }

  restoreBackup() {
    const filename = this.selectedFile();
    if (
      !filename ||
      !confirm(
        `Sei sicuro di voler sovrascrivere il DB attuale con ${filename}? Perderai i dati non salvati nel backup.`,
      )
    )
      return;

    this.isRestoring.set(true);

    this.http.post<any>(`${this.baseUrl}/restore`, { filename }).subscribe({
      next: (res) => {
        this.snackBar.open(res.data.message, 'OK', { duration: 5000 });
        this.selectedFile.set(null);

        // 🚀 Diamo al backend 2 secondi netti per riavviarsi tramite tsx,
        // poi navighiamo alla dashboard
        setTimeout(() => {
          this.isRestoring.set(false);
          this.router.navigate(['/dashboard']);
        }, 6000);
      },
      error: () => this.snackBar.open('Errore ripristino backup', 'OK'),
    });
  }
}
