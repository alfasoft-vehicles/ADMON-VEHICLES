import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map, Observable, startWith } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { JwtService } from 'src/app/services/jwt.service';
import { FolioInfoDialogComponent } from '../folio-info-dialog/folio-info-dialog.component';
import { InfoDocumentsDialogComponent } from '../info-documents-dialog/info-documents-dialog.component';

export interface drivers {
  codigo_conductor: string;
  numero_unidad: string;
  nombre_conductor: string;
  cedula: string;
  codigo_propietario: string;
}

export interface existDocumentsDrivers {
  nombre_documento: string;
  nombre_archivo: string;
  existe: boolean;
  folios: boolean;
  mensaje: string;
}

@Component({
  selector: 'app-drivers-documents',
  templateUrl: './drivers-documents.component.html',
  styleUrls: ['./drivers-documents.component.css'],
})
export class DriversDocumentsComponent implements OnInit {
  driversForm!: FormGroup;

  isLoading: boolean = true;
  selectedDriver: boolean = false;
  loadingDocumentsInfoDrivers: boolean = false;
  displayInfoDriver: boolean = false;

  drivers: drivers[] = [];

  optionsDrivers!: Observable<drivers[]>;
  documentsInfo: existDocumentsDrivers[] = [];

  constructor(
    private apiService: ApiService,
    private jwtService: JwtService,
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private breakpointObserver: BreakpointObserver,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.getDataDrivers();
  }

  initForm(): void {
    this.driversForm = this.formBuilder.group({
      conductor: [''],
    });
  }

  getCompany() {
    const userData = this.jwtService.getUserData();
    return userData ? userData.empresa : '';
  }

  getDataDrivers() {
    const company = this.getCompany();
    this.apiService
      .getData('drivers_data/' + company)
      .subscribe((data: drivers[]) => {
        this.drivers = [...data]; // Inicializar con todos los datos
        this.optionsDrivers = this.driversForm
          .get('conductor')!
          .valueChanges.pipe(
            startWith(''),
            map((value) => this._filterDrivers(value || '')),
          );
        this.isLoading = false;
      });
  }

  private _filterDrivers(value: string | drivers): drivers[] {
    const filterValue =
      typeof value === 'string'
        ? value.toLowerCase()
        : value.nombre_conductor.toLowerCase();
    return this.drivers.filter(
      (option) =>
        option.nombre_conductor.toLowerCase().includes(filterValue) ||
        option.cedula.toLowerCase().includes(filterValue),
    );
  }

  displayDriverName(driver: drivers): string {
    return driver
      ? `${driver.nombre_conductor} - ${driver.cedula} - ${driver.codigo_conductor}`
      : '';
  }

  getDocumentsInfoDriver(driver_number: string) {
    this.loadingDocumentsInfoDrivers = true;
    const company = this.getCompany();
    this.apiService
      .getData('documents/driver-documents/' + company + '/' + driver_number)
      .subscribe({
        next: (data: existDocumentsDrivers[]) => {
          this.loadingDocumentsInfoDrivers = false;
          this.selectedDriver = true;
          this.documentsInfo = data; // Asignamos los datos a la propiedad
        },
        error: (err: HttpErrorResponse) => {
          let snackbarMessage = '';

          if (err.status === 404) {
            snackbarMessage =
              'No se encontraron documentos para el conductor seleccionado. Intenta con otro.';
          } else {
            snackbarMessage =
              'Ocurrió un error inesperado. Por favor, intenta más tarde.';
          }

          this.openSnackbar(snackbarMessage);

          this.loadingDocumentsInfoDrivers = false;
          this.selectedDriver = false; // Corrected from selectedVehicle to selectedDriver
          this.documentsInfo = []; // Limpiamos los datos en caso de error
        },
      });
  }

  resetAutocomplete() {
    this.driversForm.get('conductor')?.setValue('');
    this.selectedDriver = false;
    this.displayInfoDriver = false;
    this.documentsInfo = [];
  }

  selectedOptionDriver(event: MatAutocompleteSelectedEvent): void {
    const selectedDriver = event.option.value;
    this.selectedDriver = false; // Updated from selectedVehicle to selectedDriver
    this.displayInfoDriver = false; // Updated from displayInfoVehicle to displayInfoDriver
    this.documentsInfo = []; // Limpiamos al cambiar de conductor

    if (selectedDriver) {
      this.displayInfoDriver = true;
      this.getDocumentsInfoDriver(selectedDriver.codigo_conductor);
    } else {
      this.driversForm.get('conductor')?.reset('');
    }
  }

  getDocumentDriver(driver: string, document: string): void {
    if (!driver || !document) return;

    const company = this.getCompany();

    const endpoint =
      'documents/send-driver-documents/' +
      company +
      '/' +
      driver +
      '/' +
      document;

    localStorage.setItem('pdfEndpoint', endpoint);
    window.open(`/pdf`, '_blank');
  }

  validateDocumentDriver(
    document: existDocumentsDrivers,
    nombreHtml: string,
  ): void {
    if (!document) return;

    if (!document.folios) {
      this.getDocumentDriver(
        this.driversForm.get('conductor')?.value.codigo_conductor,
        document.nombre_archivo,
      );
      return;
    }

    const isSmallScreen = this.breakpointObserver.isMatched(Breakpoints.XSmall);
    const dialogWidth = isSmallScreen ? '90vw' : '40%';

    const dialogRef = this.dialog.open(FolioInfoDialogComponent, {
      width: dialogWidth,
      disableClose: true,
      data: {
        documentName: nombreHtml,
        message: document.mensaje,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.getDocumentDriver(
          this.driversForm.get('conductor')?.value.codigo_conductor,
          document.nombre_archivo,
        );
      }
    });
  }

  openInfoDriverDialog() {
    const driverCode =
      this.driversForm.get('conductor')?.value.codigo_conductor;
    if (!driverCode) {
      this.openSnackbar('Por favor, selecciona un conductor primero.');
      return;
    }

    const data = {
      driverCode: driverCode,
      vehicleNumber: '',
    };

    const isSmallScreen = this.breakpointObserver.isMatched(Breakpoints.XSmall);
    const dialogWidth = isSmallScreen ? '90vw' : '40%';

    const dialogRef = this.dialog.open(InfoDocumentsDialogComponent, {
      width: dialogWidth,
      data: data,
    });
  }

  openSnackbar(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}
