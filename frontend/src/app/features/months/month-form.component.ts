import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { MonthsFacade } from './months.service';
import type { Expense, ExpenseCategory, ExpensePayload } from '@app/shared/types';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
  NativeDateAdapter,
} from '@angular/material/core';
import { form, FormField, min, required } from '@angular/forms/signals';

// --- MODULI MATERIAL ---
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MonthExpensesComponent } from './components/month-expenses.component';

import { CategoriesFacade } from '../categories/categories.service';

export const MY_NATIVE_FORMATS = {
  parse: {
    dateInput: 'MMM yyyy',
  },
  display: {
    dateInput: 'MMM yyyy',
    monthYearLabel: 'MMM yyyy',
    dateA11yLabel: 'LLLL yyyy',
    monthYearA11yLabel: 'MMMM yyyy',
  },
};

@Component({
  selector: 'app-month-form',
  standalone: true,
  imports: [
    CurrencyPipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatTooltipModule,
    MatSnackBarModule,
    FormField,
    MonthExpensesComponent,
  ],
  template: ` <div class="page-container">
    <header class="page-header">
      <button mat-icon-button routerLink="/dashboard">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <h1>
        {{ currentMonthId() ? 'Modifica Mese' : 'Nuovo Mese' }}
      </h1>
    </header>

    <div class="cards-layout">
      <mat-card class="form-card">
        <mat-card-header>
          <mat-card-title>Dati Principali</mat-card-title>
          <mat-card-subtitle
            >Imposta il mese e il guadagno netto ricevuto dall'agenzia</mat-card-subtitle
          >
        </mat-card-header>

        <mat-card-content>
          <form class="month-form" (submit)="saveMonthBase($event)">
            <mat-form-field appearance="outline">
              <mat-label>Mese e Anno *</mat-label>
              <input matInput [matDatepicker]="picker" [formField]="monthForm.dateObj" />
              <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker
                #picker
                startView="multi-year"
                (monthSelected)="setMonthAndYear($event, picker)"
              ></mat-datepicker>

              @if (monthForm.dateObj().errors().length && monthForm.dateObj().touched()) {
                <mat-error>{{ monthForm.dateObj().errors()[0].message }}</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Guadagno Netto Agenzia (€) *</mat-label>
              <input matInput type="number" step="0.01" [formField]="monthForm.agencyNetIncome" />

              @if (
                monthForm.agencyNetIncome().errors().length && monthForm.agencyNetIncome().touched()
              ) {
                <mat-error>{{ monthForm.agencyNetIncome().errors()[0].message }}</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Note (Opzionale)</mat-label>
              <textarea matInput rows="3" [formField]="monthForm.notes"></textarea>
            </mat-form-field>

            <div class="form-actions">
              @if (isLoading()) {
                <mat-spinner diameter="30"></mat-spinner>
              }
              <button
                mat-flat-button
                color="primary"
                type="submit"
                [disabled]="!monthForm().valid() || isLoading()"
              >
                {{ currentMonthId() ? 'Aggiorna Dati Mese' : 'Salva e Procedi' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      @if (!currentMonthId()) {
        <mat-card class="locked-card">
          <mat-card-content class="locked-content">
            <mat-icon color="disabled" class="lock-icon">lock</mat-icon>
            <h3>Sezione Spese bloccata</h3>
            <p>
              Salva i Dati Principali del mese qui sopra per sbloccare l'inserimento delle spese
              variabili.
            </p>
          </mat-card-content>
        </mat-card>
      } @else {
        <mat-card class="expenses-card">
          <mat-card-header class="expenses-header">
            <div>
              <mat-card-title>Spese del Mese</mat-card-title>
              <mat-card-subtitle>Gestisci le bollette e le spese extra</mat-card-subtitle>
            </div>
            <div class="net-result-badge">
              Netto Reale: <strong>{{ netResult() | currency: 'EUR' : 'symbol' : '1.2-2' }}</strong>
            </div>
          </mat-card-header>

          <app-month-expenses
            [expenses]="expenses()"
            [categories]="categories()"
            (add)="onAddExpense($event)"
            (delete)="onDeleteExpense($event)"
          />
        </mat-card>
      }
    </div>
  </div>`,
  styles: [
    `
      .page-container {
        padding: 24px;
        max-width: 800px;
        margin: 0 auto;
      }

      .page-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 24px;
      }

      .cards-layout {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .month-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-top: 16px;
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 16px;
      }

      /* Stili per la Card Bloccata */
      .locked-card {
        background-color: #f5f5f5;
        border: 1px dashed #ccc;
        box-shadow: none !important;
      }

      .locked-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px !important;
        text-align: center;
        color: #666;
      }

      .lock-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 16px;
        color: #999;
      }

      /* Stili per l'Header della Card Spese */
      .expenses-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
      }

      .net-result-badge {
        background-color: #e8f5e9;
        color: #2e7d32;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 1.1rem;
      }

      .add-expense-container {
        margin-top: 16px;
        display: flex;
        justify-content: center;
      }
    `,
  ],
  providers: [
    { provide: DateAdapter, useClass: NativeDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_NATIVE_FORMATS },
  ],
})
export class MonthFormComponent {
  private facade = inject(MonthsFacade);
  private categoriesFacade = inject(CategoriesFacade);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router); // Ci servirà per aggiornare l'URL dopo il salvataggio

  // 🎯 ROUTER INPUTS: Angular inietta i parametri dell'URL direttamente qui!
  public propId = input.required<string>();
  public monthId = input.required<string>();

  // Calcoliamo se siamo in modifica o creazione basandoci sull'URL
  public currentMonthId = computed(() => (this.monthId() === 'new' ? null : this.monthId()));

  public isLoading = signal<boolean>(false);
  public expenses = signal<Expense[]>([]);
  public categories = signal<ExpenseCategory[]>([]);

  // --- IL MODELLO INIZIALE ---
  public initialModel = signal({
    dateObj: new Date(),
    agencyNetIncome: null as number | null,
    notes: '',
  });

  public monthForm = form(this.initialModel, (path) => {
    required(path.dateObj, { message: "Il mese e l'anno sono obbligatori" });

    required(path.agencyNetIncome, { message: 'Il guadagno netto è obbligatorio' });
    // 🚀 Aggiunto il validatore per impedire importi negativi
    min(path.agencyNetIncome, 0, { message: "L'importo non può essere negativo" });
  });

  public netResult = computed(() => {
    const income = Number(this.initialModel().agencyNetIncome) || 0;
    const totalExpenses = this.expenses().reduce((sum, exp) => sum + Number(exp.amount), 0);
    return income - totalExpenses;
  });

  constructor() {
    // 🎯 REATTIVITÀ PURA: Niente più ngOnInit.
    // Questo effect osserva i parametri dell'URL. Se navighi o se la pagina si carica,
    // e l'ID non è 'new', scarica i dati automaticamente.
    effect(() => {
      const mId = this.monthId();
      const pId = this.propId();

      if (pId) {
        // 🚀 1. Scarica le categorie non appena abbiamo il propId
        this.loadCategories(pId);
      }

      if (mId && mId !== 'new') {
        this.loadExistingMonth(pId, mId);
      }
    });
  }

  public setMonthAndYear(normalizedMonthAndYear: Date, datepicker: any) {
    const currentDate = this.initialModel().dateObj || new Date();
    currentDate.setMonth(normalizedMonthAndYear.getMonth());
    currentDate.setFullYear(normalizedMonthAndYear.getFullYear());

    this.initialModel.update((model) => ({ ...model, dateObj: new Date(currentDate) }));
    datepicker.close();
  }

  public async saveMonthBase(event?: Event) {
    event?.preventDefault();
    if (!this.monthForm().valid()) return;

    this.isLoading.set(true);

    const formVal = this.initialModel();
    const payload = {
      year: formVal.dateObj.getFullYear(),
      month: formVal.dateObj.getMonth() + 1,
      agencyNetIncome: Number(formVal.agencyNetIncome),
      notes: formVal.notes,
    };

    try {
      if (this.currentMonthId()) {
        // PUT: Aggiorna
        await this.facade.updateMonth(this.propId(), this.currentMonthId()!, payload);
        this.snackBar.open('Dati mese aggiornati!', 'Chiudi', { duration: 3000 });
      } else {
        // POST: Crea
        const savedMonth = await this.facade.createMonth(this.propId(), payload);

        // 🚀 CAMBIO DI ROTTA STRATEGICO:
        // Sostituiamo l'URL /new con il nuovo /ID senza ricaricare la pagina.
        // Questo farà scattare l'input monthId(), che aggiornerà currentMonthId()
        // e sbloccherà la Card delle spese automaticamente!
        this.router.navigate(['/properties', this.propId(), 'months', savedMonth.id], {
          replaceUrl: true,
        });

        if (savedMonth.Expenses) {
          this.expenses.set(savedMonth.Expenses);
        }
        this.snackBar.open('Mese creato! Ora puoi aggiungere le spese.', 'Chiudi', {
          duration: 4000,
        });
      }
    } catch (error) {
      this.snackBar.open('Errore durante il salvataggio', 'Chiudi', { duration: 3000 });
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadExistingMonth(propId: string, monthId: string) {
    this.isLoading.set(true);
    try {
      const monthData = await this.facade.getMonthById(propId, monthId);
      const parsedDate = new Date(monthData.year, monthData.month - 1, 1);

      this.initialModel.set({
        dateObj: parsedDate,
        agencyNetIncome: monthData.agencyNetIncome,
        notes: monthData.notes || '',
      });

      if (monthData.Expenses) {
        this.expenses.set(monthData.Expenses);
      }
    } catch (error) {
      this.snackBar.open('Impossibile caricare il mese', 'Chiudi', { duration: 3000 });
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadCategories(propId: string) {
    try {
      // Usa il facade specializzato!
      const cats = await this.categoriesFacade.getCategories(propId);
      this.categories.set(cats);
    } catch (error) {
      this.snackBar.open('Errore nel caricamento delle categorie', 'Chiudi');
    }
  }

  // --- GESTIONE SPESE (Eventi dal componente figlio) ---

  public async onAddExpense(payload: ExpensePayload) {
    const monthId = this.currentMonthId();
    if (!monthId) return; // Sicurezza extra: non dovrebbe mai succedere

    this.isLoading.set(true);
    try {
      // 1. Chiamata POST al backend
      const newExpense = await this.facade.addExpense(this.propId(), monthId, payload);

      // 2. Aggiornamento Reattivo: Aggiungiamo la nuova spesa all'array esistente!
      // Usiamo .update() per non dover fare un'altra GET al server
      this.expenses.update((currentExpenses) => [...currentExpenses, newExpense]);

      this.snackBar.open('Spesa aggiunta con successo', 'Chiudi', { duration: 3000 });
    } catch (error) {
      this.snackBar.open("Errore durante l'aggiunta della spesa", 'Chiudi', { duration: 3000 });
    } finally {
      this.isLoading.set(false);
    }
  }

  public async onDeleteExpense(expenseId: string) {
    const monthId = this.currentMonthId();
    if (!monthId) return;

    // Conferma nativa del browser (opzionale ma consigliata per le eliminazioni)
    if (!confirm('Sei sicuro di voler eliminare questa spesa?')) return;

    this.isLoading.set(true);
    try {
      // 1. Chiamata DELETE al backend
      await this.facade.deleteExpense(this.propId(), monthId, expenseId);

      // 2. Aggiornamento Reattivo: Filtriamo via la spesa cancellata
      this.expenses.update((currentExpenses) =>
        currentExpenses.filter((exp) => exp.id !== expenseId),
      );

      this.snackBar.open('Spesa eliminata', 'Chiudi', { duration: 3000 });
    } catch (error) {
      this.snackBar.open("Errore durante l'eliminazione", 'Chiudi', { duration: 3000 });
    } finally {
      this.isLoading.set(false);
    }
  }
}
