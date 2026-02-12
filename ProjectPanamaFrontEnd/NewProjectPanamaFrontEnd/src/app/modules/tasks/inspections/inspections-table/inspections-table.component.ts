import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { map, Observable, startWith } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { JwtService } from 'src/app/services/jwt.service';
import { InspectionsAddDialogComponent } from '../inspections-add-dialog/inspections-add-dialog.component';
import { InspectionFinishImagesDialogComponent } from '../inspection-finish-images-dialog/inspection-finish-images-dialog.component';
import { TakePhotosVehicleComponent } from '../take-photos-vehicle/take-photos-vehicle.component';
import { InspectionInfoDialogComponent } from '../inspection-info-dialog/inspection-info-dialog.component';
import { ActivatedRoute, Router } from '@angular/router';
import { InspectionsGenerateQrDialogComponent } from '../inspections-generate-qr-dialog/inspections-generate-qr-dialog.component';
import { InspectionsVehicleInfoComponent } from '../inspections-vehicle-info/inspections-vehicle-info.component';

export interface owners {
  id: string;
  name: string;
}

export interface drivers {
  codigo_conductor: string;
  numero_unidad: string;
  nombre_conductor: string;
  cedula: string;
  codigo_propietario: string;
}

export interface vehicles {
  placa_vehiculo: string;
  numero_unidad: string;
  codigo_conductor: string;
  codigo_propietario: string;
  marca: string;
  linea: string;
  modelo: string;
}

export interface InspectionsInfoData {
  id: string;
  Fecha: string;
  Tipo: string;
  Id_Tipo: string;
  Descripcion: string;
  Unidad: string;
  Placa: string;
  Cupo: string;
  Usuario: string;
  Estado: string;
  Propietario: string;
  PuedeEditar: number;
  Fotos: string[];
  Firma: string[];
}

export interface apiResponse {
  id: string;
  fecha_hora: string;
  tipo_inspeccion: string;
  id_tipo_inspeccion: string;
  descripcion: string;
  unidad: string;
  placa: string;
  cupo: string;
  nombre_usuario: string;
  propietario: string;
  estado_inspeccion: string;
  puede_editar: number;
  fotos: string[];
  firma: string[];
}

@Component({
  selector: 'app-inspections',
  templateUrl: './inspections-table.component.html',
  styleUrls: ['./inspections-table.component.css'],
})
export class InspectionsTableComponent implements OnInit, AfterViewInit {
  inspectionForm!: FormGroup;
  idVehicleNumber!: string;
  owners: owners[] = [];
  drivers: drivers[] = [];
  vehicles: vehicles[] = [];

  allDrivers: drivers[] = [];
  allVehicles: vehicles[] = [];

  optionsOwners!: Observable<owners[]>;
  optionsDrivers!: Observable<drivers[]>;
  optionsVehicles!: Observable<vehicles[]>;

  maxDate: Date = new Date();

  isLoadingData = false;

  displayedColumns: string[] = [
    'Fecha',
    'Tipo',
    'Descripcion',
    'Unidad',
    'Placa',
    'Cupo',
    'Usuario',
    'Propietario',
    'Estado',
    'Acciones',
  ];
  dataSource: MatTableDataSource<InspectionsInfoData>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private jwtService: JwtService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private breakpointObserver: BreakpointObserver,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.dataSource = new MatTableDataSource<InspectionsInfoData>([]);
  }

  ngOnInit() {
    this.inspectionForm = this.fb.group({
      propietario: [''],
      conductor: [''],
      vehiculo: [''],
      fechaInicial: ['', Validators.required],
      fechaFinal: ['', Validators.required],
    });

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      this.isLoadingData = true;

      if (id) {
        this.idVehicleNumber = id;

        // Eliminar validadores de fecha solo para este caso
        this.inspectionForm.get('fechaInicial')?.clearValidators();
        this.inspectionForm.get('fechaInicial')?.updateValueAndValidity();
        this.inspectionForm.get('fechaFinal')?.clearValidators();
        this.inspectionForm.get('fechaFinal')?.updateValueAndValidity();

        this.getMaxDate();
        this.setupOwnerListener();
        this.setupDriverListener();
      } else {
        this.getTableInitialData();

        this.getMaxDate();
        this.setupOwnerListener();
        this.setupDriverListener();
      }

      this.getDataAutoCompletes();
    });
  }

  ngAfterViewInit() {
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
    };

    this.apiService
      .postData('inspections/inspections_info/all/' + company, formattedValues)
      .subscribe({
        next: (data: apiResponse[]) => {
          this.dataSource.data = data.map((item) => ({
            id: item.id,
            Fecha: item.fecha_hora,
            Tipo: item.tipo_inspeccion,
            Id_Tipo: item.id_tipo_inspeccion,
            Descripcion: item.descripcion,
            Unidad: item.unidad,
            Placa: item.placa,
            Cupo: item.cupo,
            Usuario: item.nombre_usuario,
            Propietario: item.propietario,
            Estado: item.estado_inspeccion,
            PuedeEditar: item.puede_editar,
            Fotos: item.fotos || [],
            Firma: item.firma || [],
          }));

          // Reinicializar paginator y sort después de cargar los datos
          this.initializePaginator();

          if (data.length === 0) {
            this.openSnackbar('No se encontraron inspecciones.');
          } else {
            this.openSnackbar('Inspecciones cargadas correctamente.');
          }
          this.isLoadingData = false;
        },
        error: (error) => {
          console.error('Error fetching inspections:', error);

          if (error.status === 404) {
            this.openSnackbar('No se encontraron inspecciones.');
          } else {
            this.openSnackbar(
              'Error al cargar las inspecciones. Por favor, inténtelo de nuevo más tarde.',
            );
          }
          this.isLoadingData = false;
        },
      });
  }

  getDataAutoCompletes() {
    this.getDataOwners();
    this.getDataDrivers();
    this.getDataVehicles();
  }

  getMaxDate() {
    this.apiService.getData('extras/time').subscribe(
      (response: any) => {
        const dateParts = response.time.split('-');
        this.maxDate = new Date(
          parseInt(dateParts[0]),
          parseInt(dateParts[1]) - 1,
          parseInt(dateParts[2]),
        );
      },
      (error) => {
        this.maxDate = new Date();
      },
    );
  }

  getUser() {
    const userData = this.jwtService.getUserData();
    return userData ? userData.nombre : '';
  }

  getUserId() {
    const userData = this.jwtService.getUserData();
    return userData ? userData.id : '';
  }

  getCompany() {
    const userData = this.jwtService.getUserData();
    return userData ? userData.empresa : '';
  }

  getDataOwners() {
    const company = this.getCompany();
    this.apiService.getData('owners/' + company).subscribe((data: owners[]) => {
      // Filtrar elementos con id vacío antes de almacenarlos
      this.owners = data.filter((owner) => owner.id);
      this.optionsOwners = this.inspectionForm
        .get('propietario')!
        .valueChanges.pipe(
          startWith(''),
          map((value) => this._filterOwners(value || '')),
        );
    });
  }

  setupOwnerListener() {
    this.inspectionForm
      .get('propietario')
      ?.valueChanges.subscribe((selectedOwner) => {
        // Limpiar selecciones de conductor y vehículo cuando cambie el propietario
        this.inspectionForm.patchValue({
          conductor: '',
          vehiculo: '',
        });

        if (selectedOwner && selectedOwner.id) {
          // Filtrar conductores y vehículos por propietario seleccionado
          this.filterDriversByOwner(selectedOwner.id);
          this.filterVehiclesByOwner(selectedOwner.id);
        } else {
          // Si no hay propietario seleccionado, mostrar todos
          this.resetFilters();
        }
      });
  }

  setupDriverListener() {
    // Configurar listener para vehículo (ahora el vehículo filtra los conductores)
    this.inspectionForm
      .get('vehiculo')
      ?.valueChanges.subscribe((selectedVehicle) => {
        // Limpiar selección de conductor cuando cambie el vehículo
        this.inspectionForm.patchValue({
          conductor: '',
        });

        if (selectedVehicle && selectedVehicle.numero_unidad) {
          // Filtrar conductores por vehículo seleccionado
          this.filterDriversByVehicle(selectedVehicle.numero_unidad);
        } else {
          // Si no hay vehículo seleccionado, filtrar por propietario (si hay uno seleccionado)
          const selectedOwner = this.inspectionForm.get('propietario')?.value;
          if (selectedOwner && selectedOwner.id) {
            this.filterDriversByOwner(selectedOwner.id);
          } else {
            this.resetDriverFilter();
          }
        }
      });
  }

  filterDriversByOwner(ownerId: string) {
    this.drivers = this.allDrivers.filter(
      (driver) => driver.codigo_propietario === ownerId,
    );
    this.optionsDrivers = this.inspectionForm
      .get('conductor')!
      .valueChanges.pipe(
        startWith(''),
        map((value) => this._filterDrivers(value || '')),
      );
  }

  filterVehiclesByOwner(ownerId: string) {
    this.vehicles = this.allVehicles.filter(
      (vehicle) => vehicle.codigo_propietario === ownerId,
    );
    this.optionsVehicles = this.inspectionForm
      .get('vehiculo')!
      .valueChanges.pipe(
        startWith(''),
        map((value) => this._filterVehicles(value || '')),
      );
  }

  filterDriversByVehicle(numeroUnidad: string) {
    // Encontrar el vehículo seleccionado para obtener su código de conductor
    const selectedVehicle = this.allVehicles.find(
      (vehicle) => vehicle.numero_unidad === numeroUnidad,
    );
    if (selectedVehicle) {
      // Filtrar conductores que puedan manejar este vehículo (mismo numero_unidad)
      this.drivers = this.allDrivers.filter(
        (driver) => driver.numero_unidad === numeroUnidad,
      );
    } else {
      this.drivers = [];
    }
    this.optionsDrivers = this.inspectionForm
      .get('conductor')!
      .valueChanges.pipe(
        startWith(''),
        map((value) => this._filterDrivers(value || '')),
      );
  }

  resetDriverFilter() {
    this.drivers = [...this.allDrivers];
    this.optionsDrivers = this.inspectionForm
      .get('conductor')!
      .valueChanges.pipe(
        startWith(''),
        map((value) => this._filterDrivers(value || '')),
      );
  }

  resetVehicleFilter() {
    this.vehicles = [...this.allVehicles];
    this.optionsVehicles = this.inspectionForm
      .get('vehiculo')!
      .valueChanges.pipe(
        startWith(''),
        map((value) => this._filterVehicles(value || '')),
      );
  }

  resetFilters() {
    this.drivers = [...this.allDrivers];
    this.vehicles = [...this.allVehicles];

    this.optionsDrivers = this.inspectionForm
      .get('conductor')!
      .valueChanges.pipe(
        startWith(''),
        map((value) => this._filterDrivers(value || '')),
      );

    this.optionsVehicles = this.inspectionForm
      .get('vehiculo')!
      .valueChanges.pipe(
        startWith(''),
        map((value) => this._filterVehicles(value || '')),
      );
  }

  getDataDrivers() {
    const company = this.getCompany();
    this.apiService
      .getData('drivers_data/' + company)
      .subscribe((data: drivers[]) => {
        this.allDrivers = data; // Guardar todos los conductores
        this.drivers = [...data]; // Inicializar con todos los datos
        this.optionsDrivers = this.inspectionForm
          .get('conductor')!
          .valueChanges.pipe(
            startWith(''),
            map((value) => this._filterDrivers(value || '')),
          );
      });
  }

  getDataVehicles() {
    const company = this.getCompany();
    this.apiService
      .getData('vehicles_data/' + company)
      .subscribe((data: vehicles[]) => {
        this.allVehicles = data; // Guardar todos los vehículos
        this.vehicles = [...data]; // Inicializar con todos los datos
        this.optionsVehicles = this.inspectionForm
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
            this.inspectionForm.patchValue({ vehiculo: foundVehicle });
            this.getTableData();
          } else {
            this.openSnackbar(
              'El vehículo seleccionado no existe o no está asignado a su empresa.',
            );
            this.router.navigate(['/inspections']);
          }
        }
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

  displayOwnerName(owner: owners): string {
    return owner ? `${owner.name} - ${owner.id}` : '';
  }

  displayDriverName(driver: drivers): string {
    return driver ? `${driver.nombre_conductor} - ${driver.cedula}` : '';
  }

  displayVehiclePlate(vehicle: vehicles): string {
    return vehicle
      ? `${vehicle.numero_unidad} ${vehicle.placa_vehiculo} - ${vehicle.marca} ${vehicle.linea} ${vehicle.modelo}`
      : '';
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
      // Reinicializar el paginator y sort
      this.initializePaginator();
    }
  }

  getTableData() {
    if (this.inspectionForm.invalid) {
      this.inspectionForm.markAllAsTouched();
      return;
    }

    // Limpiar datos existentes de la tabla
    this.clearTableData();

    this.isLoadingData = true;

    const formValues = this.inspectionForm.value;
    const user = this.getUserId();

    // Formatear las fechas para enviar solo YYYY-MM-DD
    const formattedValues = {
      usuario: user,
      conductor:
        formValues.conductor && formValues.conductor.codigo_conductor
          ? formValues.conductor.codigo_conductor
          : '',
      propietario:
        formValues.propietario && formValues.propietario.id
          ? formValues.propietario.id
          : '',
      vehiculo:
        formValues.vehiculo && formValues.vehiculo.numero_unidad
          ? formValues.vehiculo.numero_unidad
          : '',
      fechaInicial: formValues.fechaInicial
        ? new Date(formValues.fechaInicial).toISOString().split('T')[0]
        : '',
      fechaFinal: formValues.fechaFinal
        ? new Date(formValues.fechaFinal).toISOString().split('T')[0]
        : '',
    };

    const company = this.getCompany();

    this.apiService
      .postData('inspections/inspections_info/' + company, formattedValues)
      .subscribe({
        next: (data: apiResponse[]) => {
          this.dataSource.data = data.map((item) => ({
            id: item.id,
            Fecha: item.fecha_hora,
            Tipo: item.tipo_inspeccion,
            Id_Tipo: item.id_tipo_inspeccion,
            Descripcion: item.descripcion,
            Unidad: item.unidad,
            Placa: item.placa,
            Cupo: item.cupo,
            Usuario: item.nombre_usuario,
            Propietario: item.propietario,
            Estado: item.estado_inspeccion,
            PuedeEditar: item.puede_editar,
            Fotos: item.fotos || [],
            Firma: item.firma || [],
          }));

          // Reinicializar paginator y sort después de cargar los datos
          this.initializePaginator();

          if (data.length === 0) {
            this.openSnackbar(
              'No se encontraron inspecciones para los criterios seleccionados.',
            );
          } else {
            this.openSnackbar('Inspecciones cargadas correctamente.');
          }

          this.isLoadingData = false;
        },
        error: (error) => {
          console.error('Error fetching inspections:', error);

          if (error.status === 404) {
            this.openSnackbar(
              'No se encontraron inspecciones para los criterios seleccionados.',
            );
          } else {
            this.openSnackbar(
              'Error al cargar las inspecciones. Por favor, inténtelo de nuevo más tarde.',
            );
          }
          this.isLoadingData = false;
        },
      });
  }

  getPdfData() {
    if (this.inspectionForm.invalid && !this.idVehicleNumber) {
      this.openSnackbar('Por favor, complete las fechas requeridas.');
      this.inspectionForm.markAllAsTouched();
      return;
    }

    const formValues = this.inspectionForm.value;
    const user = this.getUserId();

    // Formatear las fechas para enviar solo YYYY-MM-DD
    const formattedValues = {
      usuario: user,
      conductor:
        formValues.conductor && formValues.conductor.codigo_conductor
          ? formValues.conductor.codigo_conductor
          : '',
      propietario:
        formValues.propietario && formValues.propietario.id
          ? formValues.propietario.id
          : '',
      vehiculo:
        formValues.vehiculo && formValues.vehiculo.numero_unidad
          ? formValues.vehiculo.numero_unidad
          : '',
      fechaInicial: formValues.fechaInicial
        ? new Date(formValues.fechaInicial).toISOString().split('T')[0]
        : '',
      fechaFinal: formValues.fechaFinal
        ? new Date(formValues.fechaFinal).toISOString().split('T')[0]
        : '',
    };

    const company = this.getCompany();

    const endpoint = 'inspections/report_inspections/' + company;

    if (endpoint) {
      localStorage.setItem('pdfEndpoint', endpoint);
      localStorage.setItem('pdfData', JSON.stringify(formattedValues));
      window.open(`/pdf`, '_blank');
    }
  }

  openDialogInspectionAdd() {
    const isSmallScreen = this.breakpointObserver.isMatched(Breakpoints.XSmall);
    const dialogWidth = isSmallScreen ? '90vw' : '60%';

    const dialogData = this.idVehicleNumber
      ? { vehicleNumber: this.idVehicleNumber }
      : undefined;

    const dialogRef = this.dialog.open(InspectionsAddDialogComponent, {
      width: dialogWidth,
      disableClose: true,
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'refresh') {
        const formValues = this.inspectionForm.value;
        const hasFilter =
          formValues.propietario ||
          formValues.conductor ||
          formValues.vehiculo ||
          formValues.fechaInicial ||
          formValues.fechaFinal;
        if (hasFilter) {
          this.getTableData();
        } else {
          this.getTableInitialData();
        }
      }
    });
  }

  openSnackbar(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
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
      default:
        return 'DESCONOCIDO';
    }
  }

  openImgDialog(inspection: InspectionsInfoData, action?: string) {
    const isSmallScreen = this.breakpointObserver.isMatched(Breakpoints.XSmall);
    const dialogWidth = isSmallScreen ? '90vw' : '60%';

    const data = {
      vehicleNumber: inspection.Unidad,
      images: action === 'viewSignature' ? inspection.Firma : inspection.Fotos,
      action: action || '',
    };

    const dialogRef = this.dialog.open(InspectionFinishImagesDialogComponent, {
      width: dialogWidth,
      data: data,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'viewPhotos' || result === 'viewSignature') {
        this.openInspectionInfoDialog(inspection.id);
      }
    });
  }

  openUploadImagesDialog(inspection: InspectionsInfoData) {
    if (inspection.PuedeEditar !== 1) {
      this.openSnackbar(
        'Solo puedes editar inspecciones PENDIENTES creadas por ti.',
      );
      return;
    }

    const isSmallScreen = this.breakpointObserver.isMatched(Breakpoints.XSmall);
    const dialogWidth = isSmallScreen ? '90vw' : '60%';

    const dialogRef = this.dialog.open(InspectionsAddDialogComponent, {
      width: dialogWidth,
      data: {
        idInspection: inspection.id,
        // No pasamos idTypeInspection para activar el modo edición
      },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'refresh') {
        const formValues = this.inspectionForm.value;
        const hasFilter =
          formValues.propietario ||
          formValues.conductor ||
          formValues.vehiculo ||
          formValues.fechaInicial ||
          formValues.fechaFinal;
        if (hasFilter) {
          this.getTableData();
        } else {
          this.getTableInitialData();
        }
      }
    });
  }

  openInspectionInfoDialog(inspectionId: string) {
    const isSmallScreen = this.breakpointObserver.isMatched(Breakpoints.XSmall);
    const dialogWidth = isSmallScreen ? '90vw' : '60%';

    const dialogRef = this.dialog.open(InspectionInfoDialogComponent, {
      width: dialogWidth,
      data: { inspectionId },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'viewPhotos' || result === 'viewSignature') {
        this.openImgDialog(
          this.dataSource.data.find((item) => item.id === inspectionId)!,
          result,
        );
      }
    });
  }

  openDocumentPDF(inspectionId: string) {
    const user = this.getUserId();
    const company = this.getCompany();

    const data = {
      user: user,
      inspection_id: inspectionId,
    };

    const endpoint = 'inspections/generate_inspection_pdf/' + company;

    localStorage.setItem('pdfEndpoint', endpoint);
    localStorage.setItem('pdfData', JSON.stringify(data));
    window.open(`/pdf`, '_blank');
  }

  openGenerateQRDialog() {
    const isSmallScreen = this.breakpointObserver.isMatched(Breakpoints.XSmall);
    const dialogWidth = isSmallScreen ? '90vw' : '60%';

    const dialogRef = this.dialog.open(InspectionsGenerateQrDialogComponent, {
      width: dialogWidth,
      disableClose: false,
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

    const dialogRef = this.dialog.open(InspectionsVehicleInfoComponent, {
      width: dialogWidth,
      data: data,
    });
  }
}
