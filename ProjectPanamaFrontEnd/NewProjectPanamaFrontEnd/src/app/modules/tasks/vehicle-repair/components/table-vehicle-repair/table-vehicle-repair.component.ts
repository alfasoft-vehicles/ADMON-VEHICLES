import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
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
import { Router } from '@angular/router';

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
  Descripcion: string;
  Unidad: string;
  Placa: string;
  Cupo: string;
  Usuario: string;
  Propietario: string;
  Estado: string;
  PuedeEditar: number;
}

// Datos mockup para la tabla
const MOCK_DATA: VehicleRepairData[] = [
  {
    id: 1,
    Fecha: '26-01-2026 18:05',
    Descripcion: 'a',
    Unidad: 'TT232',
    Placa: 'EE9910',
    Cupo: '8RIO487',
    Usuario: 'HECTOR F. VANECAS G.',
    Propietario: 'TOTAL TAXI PANAMA S.A.',
    Estado: 'SUS',
    PuedeEditar: 0,
  },
  {
    id: 2,
    Fecha: '21-01-2026 16:43',
    Descripcion: 'A',
    Unidad: 'TT232',
    Placa: 'EE9910',
    Cupo: '8RIO487',
    Usuario: 'HECTOR F. VANECAS G.',
    Propietario: 'TOTAL TAXI PANAMA S.A.',
    Estado: 'PEN',
    PuedeEditar: 1,
  },
  {
    id: 3,
    Fecha: '20-01-2026 15:44',
    Descripcion: 'a',
    Unidad: 'TT232',
    Placa: 'EE9910',
    Cupo: '8RIO487',
    Usuario: 'HECTOR F. VANECAS G.',
    Propietario: 'TOTAL TAXI PANAMA S.A.',
    Estado: 'SUS',
    PuedeEditar: 0,
  },
  {
    id: 4,
    Fecha: '19-01-2026 19:47',
    Descripcion: 'A',
    Unidad: 'TT232',
    Placa: 'EE9910',
    Cupo: '8RIO487',
    Usuario: 'HECTOR F. VANECAS G.',
    Propietario: 'TOTAL TAXI PANAMA S.A.',
    Estado: 'SUS',
    PuedeEditar: 0,
  },
  {
    id: 5,
    Fecha: '19-01-2026 18:32',
    Descripcion: 'PRUEBA',
    Unidad: 'TT232',
    Placa: 'EE9910',
    Cupo: '8RIO487',
    Usuario: 'HECTOR F. VANECAS G.',
    Propietario: 'TOTAL TAXI PANAMA S.A.',
    Estado: 'SUS',
    PuedeEditar: 0,
  },
  {
    id: 6,
    Fecha: '26-11-2025 21:26',
    Descripcion: 'PRUEBA',
    Unidad: '0340',
    Placa: 'EQ8196',
    Cupo: '13TI716',
    Usuario: 'HECTOR F. VANECAS G.',
    Propietario: 'TOTAL TAXI 2',
    Estado: 'FIN',
    PuedeEditar: 0,
  },
  {
    id: 7,
    Fecha: '26-11-2025 21:25',
    Descripcion: 'PRUEBA',
    Unidad: 'TT232',
    Placa: 'EE9910',
    Cupo: '8RIO487',
    Usuario: 'HECTOR F. VANECAS G.',
    Propietario: 'TOTAL TAXI PANAMA S.A.',
    Estado: 'FIN',
    PuedeEditar: 0,
  },
  {
    id: 8,
    Fecha: '08-11-2025 11:37',
    Descripcion: 'prueba desarrollo',
    Unidad: 'TT232',
    Placa: 'EE9910',
    Cupo: '8RIO487',
    Usuario: 'HECTOR F. VANECAS G.',
    Propietario: 'TOTAL TAXI PANAMA S.A.',
    Estado: 'FIN',
    PuedeEditar: 0,
  },
];

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
    'Descripcion',
    'Propietario',
    'Usuario',
    'Estado',
    'Acciones',
  ];
  dataSource = new MatTableDataSource<VehicleRepairData>(MOCK_DATA);
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
  ) {
    this.vehicleRepairForm = this.fb.group({
      propietario: [''],
      vehiculo: [''],
      patio: [''],
      fechaInicial: [''],
      fechaFinal: [''],
    });
  }

  ngOnInit(): void {
    // TODO: Cambiar a true
    this.isLoadingData = true;
    this.getAutocompletesData();
    this.setupListeners();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
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
      // Filtrar elementos con id vacío antes de almacenarlos
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
        // Limpiar selecciones de conductor y vehículo cuando cambie el propietario
        this.vehicleRepairForm.patchValue({
          vehiculo: '',
        });

        if (selectedOwner && selectedOwner.id) {
          // Filtrar conductores y vehículos por propietario seleccionado
          this.filterVehiclesByOwner(selectedOwner.id);
        } else {
          // Si no hay propietario seleccionado, mostrar todos
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
        this.allVehicles = data; // Guardar todos los vehículos
        this.vehicles = [...data]; // Inicializar con todos los datos
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
      // Filtrar elementos con id vacío antes de almacenarlos
      this.yards = data.filter((yard) => yard.id);
      this.isLoadingData = false;
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
      // Reinicializar el paginator y sort
      this.initializePaginator();
    }
  }

  getTableData() {
    if (this.vehicleRepairForm.invalid) {
      this.vehicleRepairForm.markAllAsTouched();
      return;
    }

    // Limpiar datos existentes de la tabla
    this.clearTableData();

    this.isLoadingData = true;

    const formValues = this.vehicleRepairForm.value;
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

    // this.apiService
    //   .postData('inspections/inspections_info/' + company, formattedValues)
    //   .subscribe({
    //     next: (data: apiResponse[]) => {
    //       this.dataSource.data = data.map((item) => ({
    //         id: item.id,
    //         Fecha: item.fecha_hora,
    //         Tipo: item.tipo_inspeccion,
    //         Id_Tipo: item.id_tipo_inspeccion,
    //         Descripcion: item.descripcion,
    //         Unidad: item.unidad,
    //         Placa: item.placa,
    //         Cupo: item.cupo,
    //         Usuario: item.nombre_usuario,
    //         Propietario: item.propietario,
    //         Estado: item.estado_inspeccion,
    //         PuedeEditar: item.puede_editar,
    //         Fotos: item.fotos || [],
    //         Firma: item.firma || [],
    //       }));

    //       // Reinicializar paginator y sort después de cargar los datos
    //       this.initializePaginator();

    //       if (data.length === 0) {
    //         this.openSnackbar(
    //           'No se encontraron inspecciones para los criterios seleccionados.',
    //         );
    //       } else {
    //         this.openSnackbar('Inspecciones cargadas correctamente.');
    //       }

    //       this.isLoadingData = false;
    //     },
    //     error: (error) => {
    //       console.error('Error fetching inspections:', error);

    //       if (error.status === 404) {
    //         this.openSnackbar(
    //           'No se encontraron inspecciones para los criterios seleccionados.',
    //         );
    //       } else {
    //         this.openSnackbar(
    //           'Error al cargar las inspecciones. Por favor, inténtelo de nuevo más tarde.',
    //         );
    //       }
    //       this.isLoadingData = false;
    //     },
    //   });
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

  openInfoVehicleRepairDialog(vehicleRepairId: number): void {
    const isSmallScreen = this.breakpointObserver.isMatched(Breakpoints.XSmall);
    const dialogWidth = isSmallScreen ? '90vw' : '60%';

    const dialogRef = this.dialog.open(InfoVehicleRepairDialogComponent, {
      width: dialogWidth,
      data: { vehicleRepairId },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'viewPhotos' || result === 'viewQR') {
        // TODO: Handle photo/QR viewing in future implementation
        console.log('Action requested:', result);
      }
    });
  }

  openAddVehicleRepairDialog(): void {
    const isSmallScreen = this.breakpointObserver.isMatched(Breakpoints.XSmall);
    const dialogWidth = isSmallScreen ? '95vw' : '70%';

    const dialogRef = this.dialog.open(AddVehicleRepairDialogComponent, {
      width: dialogWidth,
      maxWidth: '900px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'refresh') {
        // TODO: Refresh table data
        console.log('Refreshing table data...');
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
        // TODO: Refresh table data
        console.log('Refreshing table data...');
      }
    });
  }

  private openSnackbar(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}
