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
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { InfoDocumentsDialogComponent } from '../info-documents-dialog/info-documents-dialog.component';

export interface vehicles {
  placa_vehiculo: string;
  numero_unidad: string;
  codigo_conductor: string;
  codigo_propietario: string;
  nombre_propietario: string;
  propietario: string;
  marca: string;
  linea: string;
  modelo: string;
  nro_cupo: string;
}

export interface existDocumentsVehicles {
  nombre_documento: string;
  nombre_archivo: string;
  existe: boolean;
  folios: boolean;
  mensaje: string;
}

@Component({
  selector: 'app-vehicles-documents',
  templateUrl: './vehicles-documents.component.html',
  styleUrls: ['./vehicles-documents.component.css'],
})
export class VehiclesDocumentsComponent implements OnInit {
  vehiclesForm!: FormGroup;

  isLoading: boolean = true;
  selectedVehicle: boolean = false;
  loadingDocumentsInfoVehicles: boolean = false;
  displayInfoVehicle: boolean = false;

  vehicles: vehicles[] = [];

  optionsVehicles!: Observable<vehicles[]>;
  documentsInfo: existDocumentsVehicles[] = [];

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
    this.getDataVehicles();
  }

  initForm(): void {
    this.vehiclesForm = this.formBuilder.group({
      vehiculo: [''],
    });
  }

  getCompany() {
    const userData = this.jwtService.getUserData();
    return userData ? userData.empresa : '';
  }

  getDataVehicles() {
    const company = this.getCompany();
    this.apiService
      .getData('vehicles_data/' + company)
      .subscribe((data: vehicles[]) => {
        this.vehicles = [...data];
        this.optionsVehicles = this.vehiclesForm
          .get('vehiculo')!
          .valueChanges.pipe(
            startWith(''),
            map((value) => this._filterVehicles(value || '')),
          );
        this.isLoading = false;
      });
  }

  private _filterVehicles(value: string | vehicles): vehicles[] {
    const filterValue =
      typeof value === 'string'
        ? value.toLowerCase()
        : value.placa_vehiculo.toLowerCase();
    return this.vehicles.filter(
      (option) =>
        option.placa_vehiculo.toLowerCase().includes(filterValue) ||
        option.numero_unidad.toLowerCase().includes(filterValue) ||
        option.nro_cupo.toLowerCase().includes(filterValue) ||
        option.nombre_propietario.toLowerCase().includes(filterValue),
    );
  }

  displayVehicleData(vehicle: vehicles): string {
    return vehicle
      ? `${vehicle.numero_unidad} ${vehicle.placa_vehiculo} - ${vehicle.marca} ${vehicle.linea} ${vehicle.modelo}`
      : '';
  }

  getDocumentsInfoVehicle(vehicle_number: string) {
    this.loadingDocumentsInfoVehicles = true;
    const company = this.getCompany();
    this.apiService
      .getData('documents/vehicle-documents/' + company + '/' + vehicle_number)
      .subscribe({
        next: (data: existDocumentsVehicles[]) => {
          this.loadingDocumentsInfoVehicles = false;
          this.selectedVehicle = true;
          this.documentsInfo = data; // Asignamos los datos a la propiedad
        },
        error: (err: HttpErrorResponse) => {
          let snackbarMessage = '';

          if (err.status === 404) {
            snackbarMessage =
              'No se encontraron documentos para el vehículo seleccionado. Intenta con otro.';
          } else {
            snackbarMessage =
              'Ocurrió un error inesperado. Por favor, intenta más tarde.';
          }

          this.openSnackbar(snackbarMessage);

          this.loadingDocumentsInfoVehicles = false;
          // this.vehiclesForm.get('vehiculo')?.reset('');
          this.selectedVehicle = false;
          this.documentsInfo = []; // Limpiamos los datos en caso de error
        },
      });
  }

  resetAutocomplete() {
    this.vehiclesForm.get('vehiculo')?.setValue('');
    this.selectedVehicle = false;
    this.displayInfoVehicle = false;
    this.documentsInfo = [];
  }

  selectedOptionVehicle(event: MatAutocompleteSelectedEvent): void {
    const selectedVehicle = event.option.value;
    this.selectedVehicle = false;
    this.displayInfoVehicle = false;
    this.documentsInfo = []; // Limpiamos al cambiar de vehículo

    if (selectedVehicle) {
      this.displayInfoVehicle = true;
      this.getDocumentsInfoVehicle(selectedVehicle.numero_unidad);
    } else {
      this.vehiclesForm.get('vehiculo')?.reset('');
    }
  }

  getDocumentVehicle(vehicle: string, document: string): void {
    if (!vehicle || !document) return;

    const company = this.getCompany();

    const endpoint =
      'documents/send-vehicle-documents/' +
      company +
      '/' +
      vehicle +
      '/' +
      document;

    localStorage.setItem('pdfEndpoint', endpoint);
    window.open(`/pdf`, '_blank');
  }

  validateDocumentVehicle(
    document: existDocumentsVehicles,
    nombreHtml: string,
  ): void {
    if (!document) return;

    if (!document.folios) {
      this.getDocumentVehicle(
        this.vehiclesForm.get('vehiculo')?.value.numero_unidad,
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
        this.getDocumentVehicle(
          this.vehiclesForm.get('vehiculo')?.value.numero_unidad,
          document.nombre_archivo,
        );
      }
    });
  }

  openInfoVehicleDialog() {
    const vehicleNumber =
      this.vehiclesForm.get('vehiculo')?.value.numero_unidad;
    if (!vehicleNumber) {
      this.openSnackbar('Por favor, selecciona un vehículo primero.');
      return;
    }

    const data = {
      driverCode: '',
      vehicleNumber: vehicleNumber,
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
