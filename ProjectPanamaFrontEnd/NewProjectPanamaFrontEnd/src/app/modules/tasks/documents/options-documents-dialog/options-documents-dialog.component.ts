import { Component } from '@angular/core';

@Component({
  selector: 'app-options-documents-dialog',
  templateUrl: './options-documents-dialog.component.html',
  styleUrls: ['./options-documents-dialog.component.css']
})
export class OptionsDocumentsDialogComponent {
  vehiclesDocuments: boolean = false;
  driversDocuments: boolean = false;

  constructor() {}

  openDocuments(option: string) {
    if (option === 'vehicles') {
      this.vehiclesDocuments = true;
      this.driversDocuments = false;
    } else if (option === 'drivers') {
      this.vehiclesDocuments = false;
      this.driversDocuments = true;
    } else if (option === 'close') {
      this.vehiclesDocuments = false;
      this.driversDocuments = false;
    }
  }
}
