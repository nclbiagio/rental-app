import { Component, inject } from '@angular/core';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Conferma azione</h2>
    <mat-dialog-content>
      <p [innerHTML]="data.message"></p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(false)">Annulla</button>
      <button mat-flat-button color="warn" (click)="dialogRef.close(true)">Procedi</button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDialogComponent {
  public dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
  public data = inject<{ message: string }>(MAT_DIALOG_DATA);
}
