import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-finish-repair-note-dialog',
  templateUrl: './finish-repair-note-dialog.component.html',
  styleUrls: ['./finish-repair-note-dialog.component.css']
})
export class FinishRepairNoteDialogComponent {
  noteForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<FinishRepairNoteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder
  ) {
    this.noteForm = this.fb.group({
      note: ['', Validators.required]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (this.noteForm.valid) {
      this.dialogRef.close(this.noteForm.value.note);
    } else {
      this.noteForm.markAllAsTouched();
    }
  }
}
