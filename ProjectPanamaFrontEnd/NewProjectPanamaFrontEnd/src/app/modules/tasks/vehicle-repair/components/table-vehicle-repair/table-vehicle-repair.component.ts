import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { InfoVehicleRepairDialogComponent } from '../dialogs/info-vehicle-repair-dialog/info-vehicle-repair-dialog.component';
import { AddVehicleRepairDialogComponent } from '../dialogs/add-vehicle-repair-dialog/add-vehicle-repair-dialog.component';
import { map, Observable, startWith } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { JwtService } from 'src/app/services/jwt.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, ActivatedRoute } from '@angular/router';
import { FinishImagesRepairDialogComponent } from '../dialogs/finish-images-repair-dialog/finish-images-repair-dialog.component';
import { VehiclesRepairInfoComponent } from '../dialogs/vehicles-repair-info/vehicles-repair-info.component';
import { ConfirmActionDialogComponent } from 'src/app/modules/shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { FinishRepairNoteDialogComponent } from '../dialogs/finish-repair-note-dialog/finish-repair-note-dialog.component';

interface owners {
  id: string;
  name: string;
}

interface vehicles {
  placa_vehiculo: string;
  numero_unidad: string;
  codigo_conductor: string;
  codigo_propietario: string;
  marca: string;
  linea: string;
  modelo: string;
}

interface yards {
  id: string;
  name: string;
}

export interface VehicleRepairData {
  id: number;
  Fecha: string;
  Unidad: string;
  Placa: string;
  Cupo: string;
  Patio: string;
  Justificacion: string;
  Propietario: string;
  Usuario: string;
  Estado: string;
  PuedeEditar: number;
  Fotos: string[];
  expanded?: boolean;
}

export interface apiResponse {
  id: number;
  fecha_hora: string;
  unidad: string;
  placa: string;
  cupo: string;
  patio: string;
  justificacion: string;
  propietario: string;
  usuario: string;
  estado: string;
  puede_editar: number;
  fotos: string[];
}

@Component({
  selector: 'app-table-vehicle-repair',
  templateUrl: './table-vehicle-repair.component.html',
  styleUrls: ['./table-vehicle-repair.component.css'],
})
export class TableVehicleRepairComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'Fecha',
    'Unidad',
    'Placa',
    'Cupo',
    'Patio',
    'Justificacion',
    'Propietario',
    'Usuario',
    'Estado',
    'Acciones',
  ];
  dataSource: MatTableDataSource<VehicleRepairData>;
  isLoadingData = false;
  maxDate = new Date();

  // Opciones para los autocompletes
  owners: owners[] = [];
  vehicles: vehicles[] = [];
  yards: yards[] = [];

  allVehicles: vehicles[] = [];

  optionsOwners!: Observable<owners[]>;
  optionsVehicles!: Observable<vehicles[]>;
  optionsYards!: Observable<yards[]>;

  vehicleRepairForm: FormGroup;
  idVehicleNumber!: string;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private breakpointObserver: BreakpointObserver,
    private apiService: ApiService,
    private jwtService: JwtService,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.dataSource = new MatTableDataSource<VehicleRepairData>([]);
    this.vehicleRepairForm = this.fb.group({
      propietario: [''],
      vehiculo: [''],
      patio: [''],
      fechaInicial: ['', Validators.required],
      fechaFinal: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      this.isLoadingData = true;

      if (id) {
        this.idVehicleNumber = id;

        // Eliminar validadores de fecha solo para este caso
        this.vehicleRepairForm.get('fechaInicial')?.clearValidators();
        this.vehicleRepairForm.get('fechaInicial')?.updateValueAndValidity();
        this.vehicleRepairForm.get('fechaFinal')?.clearValidators();
        this.vehicleRepairForm.get('fechaFinal')?.updateValueAndValidity();

        this.setupOwnerListener();
      } else {
        this.getTableInitialData();
        this.setupOwnerListener();
      }

      this.getAutocompletesData();
    });
  }

  ngAfterViewInit(): void {
    if (this.paginator && this.sort) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;

      this.dataSource.sortingDataAccessor = (item, property) => {
        if (property === 'Fecha') {
          const [datePart, timePart] = item.Fecha.split(' ');
          const [day, month, year] = datePart.split('-');
          const dateTimeString = `${year}-${month}-${day}T${timePart}:00`;
          return new Date(dateTimeString).getTime();
        }
        return (item as any)[property];
      };

      this.sort.active = 'Fecha';
      this.sort.direction = 'desc';
      this.dataSource.sort = this.sort;
    }
  }

  getTableInitialData() {
    this.isLoadingData = true;

    const company = this.getCompany();
    const formattedValues = {
      usuario: this.getUserId(),
      propietario: '',
      vehiculo: '',
      patio: '',
      fechaInicial: '',
      fechaFinal: '',
    };

    this.apiService
      .postData('vehicles_to_repair/vehicles_info/' + company, formattedValues)
      .subscribe({
        next: (data: apiResponse[]) => {
          this.dataSource.data = data.map((item) => ({
            id: item.id,
            Fecha: item.fecha_hora,
            Unidad: item.unidad,
            Placa: item.placa,
            Cupo: item.cupo,
            Patio: item.patio,
            Justificacion: item.justificacion,
            Propietario: item.propietario,
            Usuario: item.usuario,
            Estado: item.estado,
            PuedeEditar: item.puede_editar,
            Fotos: item.fotos || [],
          }));

          this.initializePaginator();

          if (data.length === 0) {
            this.openSnackbar('No se encontraron registros.');
          } else {
            this.openSnackbar('Registros cargados correctamente.');
          }
          this.isLoadingData = false;
        },
        error: (error) => {
          console.error('Error fetching vehicles to repair:', error);
          this.isLoadingData = false;
        },
      });
  }

  getAutocompletesData() {
    this.getDataOwners();
    this.getDataVehicles();
    this.getDataYards();
  }

  setupListeners() {
    this.setupOwnerListener();
  }

  private getCompany() {
    const userData = this.jwtService.getUserData();
    return userData ? userData.empresa : '';
  }

  private getUserId() {
    const userData = this.jwtService.getUserData();
    return userData ? userData.id : '';
  }

  getDataOwners() {
    const company = this.getCompany();
    this.apiService.getData('owners/' + company).subscribe((data: owners[]) => {
      this.owners = data.filter((owner) => owner.id);
      this.optionsOwners = this.vehicleRepairForm
        .get('propietario')!
        .valueChanges.pipe(
          startWith(''),
          map((value) => this._filterOwners(value || '')),
        );
    });
  }

  private _filterOwners(value: string | owners): owners[] {
    const filterValue =
      typeof value === 'string'
        ? value.toLowerCase()
        : value.name.toLowerCase();
    return this.owners.filter(
      (option) =>
        option.name.toLowerCase().includes(filterValue) ||
        option.id.toLowerCase().includes(filterValue),
    );
  }

  setupOwnerListener() {
    this.vehicleRepairForm
      .get('propietario')
      ?.valueChanges.subscribe((selectedOwner) => {
        this.vehicleRepairForm.patchValue({
          vehiculo: '',
        });

        if (selectedOwner && selectedOwner.id) {
          this.filterVehiclesByOwner(selectedOwner.id);
        } else {
          this.resetFilters();
        }
      });
  }

  displayOwnerName(owner: owners): string {
    return owner ? `${owner.name} - ${owner.id}` : '';
  }

  getDataVehicles() {
    const company = this.getCompany();
    this.apiService
      .getData('vehicles_data/' + company)
      .subscribe((data: vehicles[]) => {
        this.allVehicles = data;
        this.vehicles = [...data];
        this.optionsVehicles = this.vehicleRepairForm
          .get('vehiculo')!
          .valueChanges.pipe(
            startWith(''),
            map((value) => this._filterVehicles(value || '')),
          );

        if (this.idVehicleNumber) {
          const foundVehicle = this.allVehicles.find(
            (v) => v.numero_unidad === this.idVehicleNumber,
          );

          if (foundVehicle) {
            this.vehicleRepairForm.patchValue({ vehiculo: foundVehicle });
            this.getTableData();
          } else {
            this.openSnackbar(
              'El vehículo seleccionado no existe o no está asignado a su empresa.',
            );
            this.router.navigate(['/vehicle-repair']);
          }
        }
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
        option.numero_unidad.toLowerCase().includes(filterValue),
    );
  }

  displayVehiclePlate(vehicle: vehicles): string {
    return vehicle
      ? `${vehicle.numero_unidad} ${vehicle.placa_vehiculo} - ${vehicle.marca} ${vehicle.linea} ${vehicle.modelo}`
      : '';
  }

  filterVehiclesByOwner(ownerId: string) {
    this.vehicles = this.allVehicles.filter(
      (vehicle) => vehicle.codigo_propietario === ownerId,
    );
    this.optionsVehicles = this.vehicleRepairForm
      .get('vehiculo')!
      .valueChanges.pipe(
        startWith(''),
        map((value) => this._filterVehicles(value || '')),
      );
  }

  getDataYards() {
    const company = this.getCompany();
    this.apiService.getData('yards/' + company).subscribe((data: yards[]) => {
      this.yards = data.filter((yard) => yard.id);
      this.optionsYards = this.vehicleRepairForm
        .get('patio')!
        .valueChanges.pipe(
          startWith(''),
          map((value) => this._filterYards(value || '')),
        );
    });
  }

  private _filterYards(value: string | yards): yards[] {
    const filterValue =
      typeof value === 'string'
        ? value.toLowerCase()
        : value.name.toLowerCase();
    return this.yards.filter(
      (option) =>
        option.name.toLowerCase().includes(filterValue) ||
        option.id.toLowerCase().includes(filterValue),
    );
  }

  displayYardName(yard: yards): string {
    return yard ? `${yard.name} - ${yard.id}` : '';
  }

  resetFilters() {
    this.vehicles = [...this.allVehicles];

    this.optionsVehicles = this.vehicleRepairForm
      .get('vehiculo')!
      .valueChanges.pipe(
        startWith(''),
        map((value) => this._filterVehicles(value || '')),
      );
  }

  private initializePaginator() {
    setTimeout(() => {
      if (this.paginator && this.sort) {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      }
    }, 0);
  }

  clearTableData() {
    if (this.dataSource.data.length > 0) {
      this.dataSource.data = [];
      this.initializePaginator();
    }
  }

  getTableData() {
    if (this.vehicleRepairForm.invalid) {
      this.openSnackbar(
        'Por favor, complete las fechas requeridas para realizar la búsqueda.',
      );
      this.vehicleRepairForm.markAllAsTouched();
      return;
    }

    this.clearTableData();
    this.isLoadingData = true;

    const formValues = this.vehicleRepairForm.value;
    const user = this.getUserId();
    const company = this.getCompany();

    const formattedValues = {
      usuario: user,
      propietario: formValues.propietario?.id || '',
      vehiculo: formValues.vehiculo?.numero_unidad || '',
      patio: formValues.patio?.id || '',
      fechaInicial: formValues.fechaInicial
        ? new Date(formValues.fechaInicial).toISOString().split('T')[0]
        : '',
      fechaFinal: formValues.fechaFinal
        ? new Date(formValues.fechaFinal).toISOString().split('T')[0]
        : '',
    };

    this.apiService
      .postData('vehicles_to_repair/vehicles_info/' + company, formattedValues)
      .subscribe({
        next: (data: apiResponse[]) => {
          this.dataSource.data = data.map((item) => ({
            id: item.id,
            Fecha: item.fecha_hora,
            Unidad: item.unidad,
            Placa: item.placa,
            Cupo: item.cupo,
            Patio: item.patio,
            Justificacion: item.justificacion,
            Propietario: item.propietario,
            Usuario: item.usuario,
            Estado: item.estado,
            PuedeEditar: item.puede_editar,
            Fotos: item.fotos || [],
          }));

          this.initializePaginator();

          if (data.length === 0) {
            this.openSnackbar('No se encontraron registros.');
          } else {
            this.openSnackbar('Registros cargados correctamente.');
          }
          this.isLoadingData = false;
        },
        error: (error) => {
          console.error('Error fetching vehicles to repair:', error);
          if (error.status === 404) {
            this.openSnackbar('No se encontraron registros.');
          } else {
            this.openSnackbar('Error al cargar los registros.');
          }
          this.isLoadingData = false;
        },
      });
  }

  getEstadoText(estado: string): string {
    switch (estado) {
      case 'PEN':
        return '<strong>PENDIENTE</strong>';
      case 'SUS':
        return '<strong>SUSPENDIDO</strong>';
      case 'FIN':
        return 'FINALIZADO';
      case 'TER':
        return 'RETIRADO';
      default:
        return 'DESCONOCIDO';
    }
  }

  isLongText(text: string): boolean {
    return text ? text.length > 60 : false;
  }

  openInfoVehicleRepairDialog(vehicleRepairId: number): void {
    const isSmallScreen = this.breakpointObserver.isMatched(Breakpoints.XSmall);
    const dialogWidth = isSmallScreen ? '90vw' : '60%';

    const dialogRef = this.dialog.open(InfoVehicleRepairDialogComponent, {
      width: dialogWidth,
      data: { vehicleRepairId },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'viewPhotos') {
        const row = this.dataSource.data.find(
          (item) => item.id === vehicleRepairId,
        );
        if (row) this.openImgDialog(row, 'viewPhotos');
      }
    });
  }

  getTableInfoFilters() {
    const formValues = this.vehicleRepairForm.value;
    const hasFilter =
      formValues.propietario ||
      formValues.vehiculo ||
      formValues.patio ||
      formValues.fechaInicial ||
      formValues.fechaFinal ||
      this.idVehicleNumber;
    if (hasFilter) {
      this.getTableData();
    } else {
      this.getTableInitialData();
    }
  }

  openAddVehicleRepairDialog(): void {
    const isSmallScreen = this.breakpointObserver.isMatched(Breakpoints.XSmall);
    const dialogWidth = isSmallScreen ? '95vw' : '70%';

    const dialogData = this.idVehicleNumber
      ? { vehicleNumber: this.idVehicleNumber }
      : undefined;

    const dialogRef = this.dialog.open(AddVehicleRepairDialogComponent, {
      width: dialogWidth,
      maxWidth: '900px',
      disableClose: true,
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'refresh') {
        this.getTableInfoFilters();
      }
    });
  }

  openEditVehicleRepairDialog(vehicleRepairId: number): void {
    const isSmallScreen = this.breakpointObserver.isMatched(Breakpoints.XSmall);
    const dialogWidth = isSmallScreen ? '95vw' : '70%';

    const dialogRef = this.dialog.open(AddVehicleRepairDialogComponent, {
      width: dialogWidth,
      maxWidth: '900px',
      data: { idVehicleRepair: vehicleRepairId.toString() },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'refresh') {
        this.getTableInfoFilters();
      }
    });
  }

  openImgDialog(row: VehicleRepairData, action?: string) {
    const isSmallScreen = this.breakpointObserver.isMatched(Breakpoints.XSmall);
    const dialogWidth = isSmallScreen ? '90vw' : '60%';

    const data = {
      vehicleNumber: row.Unidad,
      images: row.Fotos,
      action: action || '',
    };

    const dialogRef = this.dialog.open(FinishImagesRepairDialogComponent, {
      width: dialogWidth,
      data: data,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'viewPhotos') {
        this.openInfoVehicleRepairDialog(row.id);
      }
    });
  }

  openInfoVehicle() {
    if (!this.idVehicleNumber) {
      this.openSnackbar('No hay vehículo seleccionado.');
      return;
    }

    const isSmallScreen = this.breakpointObserver.isMatched(Breakpoints.XSmall);
    const dialogWidth = isSmallScreen ? '90vw' : '40%';

    const data = {
      driverCode: '',
      vehicleNumber: this.idVehicleNumber,
    };

    const dialogRef = this.dialog.open(VehiclesRepairInfoComponent, {
      width: dialogWidth,
      data: data,
    });
  }

  openDocumentPDF(entryId: number) {
    this.apiService
      .getData(`vehicles_to_repair/get_pdf_url/${entryId}`)
      .subscribe({
        next: (response: any) => {
          if (response.url) {
            window.open(response.url, '_blank');
          } else {
            this.openSnackbar('No se encontró la URL del documento.');
          }
        },
        error: (error) => {
          console.error('Error fetching PDF URL:', error);
          this.openSnackbar('Error al obtener el documento.');
        },
      });
  }

  openRemoveVehicleDialog(row: VehicleRepairData) {
    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '400px',
      data: {
        documentName: 'Retirar Vehículo',
        message: `¿Está seguro de que desea confirmar la retirada del vehículo con unidad ${row.Unidad} y placa ${row.Placa}?`,
      },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const noteDialogRef = this.dialog.open(
          FinishRepairNoteDialogComponent,
          {
            width: '400px',
            disableClose: true,
          },
        );

        noteDialogRef.afterClosed().subscribe((noteResult) => {
          if (noteResult) {
            const payload = {
              entry_id: row.id,
              notes: noteResult,
              user: this.getUserId(),
            };

            this.apiService
              .postData('vehicles_to_repair/finish_repair', payload)
              .subscribe({
                next: () => {
                  this.openSnackbar('Vehículo retirado exitosamente.');
                  this.getTableInfoFilters();
                },
                error: (error) => {
                  console.error('Error finishing repair:', error);
                  this.openSnackbar('Error al retirar el vehículo.');
                },
              });
          }
        });
      }
    });
  }

  getPdfData() {
    if (this.vehicleRepairForm.invalid) {
      this.openSnackbar(
        'Por favor, complete las fechas requeridas para generar el reporte.',
      );
      this.vehicleRepairForm.markAllAsTouched();
      return;
    }

    const formValues = this.vehicleRepairForm.value;
    const user = this.getUserId();
    const company = this.getCompany();

    const formattedValues = {
      usuario: user,
      propietario: formValues.propietario?.id || '',
      vehiculo: formValues.vehiculo?.numero_unidad || '',
      patio: formValues.patio?.id || '',
      fechaInicial: formValues.fechaInicial
        ? new Date(formValues.fechaInicial).toISOString().split('T')[0]
        : '',
      fechaFinal: formValues.fechaFinal
        ? new Date(formValues.fechaFinal).toISOString().split('T')[0]
        : '',
    };

    const endpoint = 'vehicles_to_repair/report_repairs/' + company;

    localStorage.setItem('pdfEndpoint', endpoint);
    localStorage.setItem('pdfData', JSON.stringify(formattedValues));
    window.open(`/pdf`, '_blank');
  }

  private openSnackbar(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}
