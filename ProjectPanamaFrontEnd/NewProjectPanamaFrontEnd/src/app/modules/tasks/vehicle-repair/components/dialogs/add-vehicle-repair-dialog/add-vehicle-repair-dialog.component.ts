import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map, Observable, startWith, forkJoin } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { JwtService } from 'src/app/services/jwt.service';
import { TakePhotosRepairComponent } from '../take-photos-repair/take-photos-repair.component';

interface Vehicles {
  placa_vehiculo: string;
  numero_unidad: string;
  marca: string;
  linea: string;
  modelo: string;
  nro_cupo: string;
  codigo_propietario: string;
  nombre_propietario: string;
}

interface Patio {
  id: string;
  codigo: string;
  nombre: string;
}

interface VehicleRepairData {
  numero: string;
  marca: string;
  modelo: string;
  placa: string;
  propietario: string;
  estado_vehiculo: string;
  cupo: string;
  conductor_nombre: string;
  conductor_codigo: string;
  conductor_celular: string;
  fecha: string;
  hora: string;
}

interface VehicleRepairCreateResponse {
  id: string;
}

@Component({
  selector: 'app-add-vehicle-repair-dialog',
  templateUrl: './add-vehicle-repair-dialog.component.html',
  styleUrls: ['./add-vehicle-repair-dialog.component.css'],
})
export class AddVehicleRepairDialogComponent implements OnInit {
  @ViewChild(TakePhotosRepairComponent)
  takePhotosRepairComponent!: TakePhotosRepairComponent;

  vehicleRepairForm!: FormGroup;

  isLoading: boolean = true;

  vehicles: Vehicles[] = [];
  optionsVehicles!: Observable<Vehicles[]>;

  patios: Patio[] = [];

  loadingVehicleInfo: boolean = false;
  selectedVehicle: boolean = false;
  selectedVehicleObject: Vehicles | null = null;

  vehicleInfo!: VehicleRepairData;

  vehicleRepairId: string = '';

  isEditMode: boolean = false;
  vehicleRepairDataEdit: any = null;
  wasEdited: boolean = false;

  constructor(
    private apiService: ApiService,
    private jwtService: JwtService,
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<AddVehicleRepairDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      idVehicleRepair: string;
      vehicleNumber: string;
    },
  ) {}

  ngOnInit(): void {
    if (this.data && this.data.idVehicleRepair) {
      // Edit mode
      this.isEditMode = true;
      this.vehicleRepairId = this.data.idVehicleRepair;
      this.loadVehicleRepairData(this.data.idVehicleRepair);
    } else {
      // Create mode
      this.getInputsData();
      this.resetVehicleInfo();
      this.initForms();
    }
  }

  getInputsData() {
    this.getDataVehicles();
    this.getPatios();
  }

  loadVehicleRepairData(vehicleRepairId: string) {
    this.isLoading = true;
    this.resetVehicleInfo();
    this.initForms();

    const company = this.getCompany();

    // Load data in parallel using forkJoin
    forkJoin({
      vehicles: this.apiService.getData('inspections/vehicles_data/' + company),
      patios: this.getMockPatios(),
      vehicleRepairData: this.getMockVehicleRepairDetails(vehicleRepairId),
    }).subscribe(
      (results: any) => {
        // Save vehicles
        this.vehicles = [...results.vehicles];
        this.optionsVehicles = this.vehicleRepairForm
          .get('vehiculo')!
          .valueChanges.pipe(
            startWith(''),
            map((value) => this._filterVehicles(value || '')),
          );

        // Save patios
        this.patios = [...results.patios];

        // Save vehicle repair data
        this.vehicleRepairDataEdit = results.vehicleRepairData;

        // Populate form with data
        this.populateFormWithVehicleRepairData(results.vehicleRepairData);

        // In edit mode, remove vehiculo validator since it's not editable
        this.vehicleRepairForm.get('vehiculo')?.clearValidators();
        this.vehicleRepairForm.get('vehiculo')?.updateValueAndValidity();

        this.isLoading = false;
      },
      (error) => {
        console.error('Error al cargar datos de reparación:', error);
        this.openSnackbar('Error al cargar los datos de la reparación.');
        this.isLoading = false;
        this.closeDialog();
      },
    );
  }

  // Mock patios data - TODO: Replace with API call
  getMockPatios(): Observable<Patio[]> {
    return new Observable((observer) => {
      setTimeout(() => {
        observer.next([
          { id: '1', codigo: 'PAT001', nombre: 'PATIO PRINCIPAL' },
          { id: '2', codigo: 'PAT002', nombre: 'PATIO SECUNDARIO' },
          { id: '3', codigo: 'PAT003', nombre: 'PATIO NORTE' },
          { id: '4', codigo: 'PAT004', nombre: 'PATIO SUR' },
        ]);
        observer.complete();
      }, 100);
    });
  }

  // Mock vehicle repair details - TODO: Replace with API call
  getMockVehicleRepairDetails(id: string): Observable<any> {
    return new Observable((observer) => {
      setTimeout(() => {
        observer.next({
          id: parseInt(id),
          unidad: 'TT232',
          placa: 'EE9910',
          propietario: 'TOTAL TAXI PANAMA S.A.',
          estado_vehiculo: 'EN REPARACIÓN',
          cupo: '8RIO487',
          conductor_nombre: 'PEDRO GÓMEZ',
          conductor_codigo: '100',
          conductor_celular: '6000-0000',
          fecha: '26-01-2026',
          hora: '18:05',
          patio: { id: '1', codigo: 'PAT001', nombre: 'PATIO PRINCIPAL' },
          descripcion: 'Reparación de frenos y suspensión',
        });
        observer.complete();
      }, 100);
    });
  }

  populateFormWithVehicleRepairData(data: any) {
    // Preload vehicle info
    this.vehicleInfo = {
      numero: data.unidad,
      marca: '',
      modelo: '',
      placa: data.placa,
      estado_vehiculo: data.estado_vehiculo,
      propietario: data.propietario,
      cupo: data.cupo,
      conductor_nombre: data.conductor_nombre,
      conductor_codigo: data.conductor_codigo,
      conductor_celular: data.conductor_celular,
      fecha: data.fecha,
      hora: data.hora,
    };

    // Find vehicle in list to preselect
    const vehicleMatch = this.vehicles.find(
      (v) => v.numero_unidad === data.unidad,
    );

    if (vehicleMatch) {
      this.vehicleRepairForm.patchValue({
        vehiculo: vehicleMatch,
      });
      // Store the vehicle object for displaying in edit mode
      this.selectedVehicleObject = vehicleMatch;
    }

    // Preselect patio
    if (data.patio) {
      const patioMatch = this.patios.find((p) => p.id === data.patio.id);
      if (patioMatch) {
        this.vehicleRepairForm.patchValue({
          patio: patioMatch,
        });
      }
    }

    // Set description
    this.vehicleRepairForm.patchValue({
      descripcion: data.descripcion || '',
    });

    // In edit mode, always mark selectedVehicle as true since we have the data
    this.selectedVehicle = true;
  }

  initForms(): void {
    this.vehicleRepairForm = this.formBuilder.group({
      vehiculo: ['', Validators.required],
      patio: ['', Validators.required],
      descripcion: ['', Validators.required],
    });
  }

  getCompany() {
    const userData = this.jwtService.getUserData();
    return userData ? userData.empresa : '';
  }

  getDataVehicles() {
    const company = this.getCompany();
    this.apiService
      .getData('inspections/vehicles_data/' + company)
      .subscribe((data: Vehicles[]) => {
        this.vehicles = [...data];
        this.optionsVehicles = this.vehicleRepairForm
          .get('vehiculo')!
          .valueChanges.pipe(
            startWith(''),
            map((value) => this._filterVehicles(value || '')),
          );

        this.isLoading = false;
      });
  }

  getPatios() {
    // TODO: Replace with API call when endpoint is available
    this.getMockPatios().subscribe((data: Patio[]) => {
      this.patios = [...data];
    });
  }

  private _filterVehicles(value: string | Vehicles): Vehicles[] {
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

  displayVehicleData(vehicle: Vehicles): string {
    return vehicle
      ? `${vehicle.numero_unidad} - ${vehicle.placa_vehiculo} - ${vehicle.marca} ${vehicle.linea} ${vehicle.modelo}`
      : '';
  }

  openSnackbar(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  resetVehicleInfo() {
    this.vehicleInfo = {
      numero: '',
      marca: '',
      modelo: '',
      placa: '',
      estado_vehiculo: '',
      propietario: '',
      cupo: '',
      conductor_nombre: '',
      conductor_codigo: '',
      conductor_celular: '',
      fecha: '',
      hora: '',
    };
  }

  selectedOptionVehicle(event: MatAutocompleteSelectedEvent): void {
    this.resetVehicleInfo();
    this.selectedVehicle = false;

    const selectedVehicle = event.option.value.numero_unidad;

    if (selectedVehicle) {
      this.loadingVehicleInfo = true;
      this.getVehicleInfo(selectedVehicle);
    } else {
      this.vehicleRepairForm.get('vehiculo')?.reset('');
      this.openSnackbar(
        'No se ha encontrado información del vehículo seleccionado. Prueba con otro.',
      );
    }
  }

  getVehicleInfo(vehicle: string) {
    const company = this.getCompany();

    this.apiService
      .getData('inspections/new_inspection_data/' + company + '/' + vehicle)
      .subscribe(
        (data: any) => {
          this.vehicleInfo = {
            numero: data.numero,
            marca: '',
            modelo: '',
            placa: data.placa,
            propietario: data.propietario,
            estado_vehiculo: data.estado_vehiculo,
            cupo: data.cupo,
            conductor_nombre: data.conductor_nombre,
            conductor_codigo: data.conductor_codigo,
            conductor_celular: data.conductor_celular,
            fecha: data.fecha_inspeccion,
            hora: data.hora_inspeccion,
          };
          this.loadingVehicleInfo = false;
          this.selectedVehicle = true;
        },
        (error) => {
          console.error('Error fetching vehicle info:', error);
          this.openSnackbar(
            'Error al obtener la información del vehículo seleccionado. Vuelve a intentarlo más tarde.',
          );
          this.loadingVehicleInfo = false;
          this.selectedVehicle = false;
        },
      );
  }

  startVehicleRepair() {
    if (this.vehicleRepairForm.invalid || !this.selectedVehicle) {
      this.openSnackbar('Por favor, completa los campos requeridos.');
      this.vehicleRepairForm.markAllAsTouched();
      return;
    }

    // Create/update vehicle repair record
    this.onSaveOrNext();
  }

  onSaveOrNext() {
    if (this.vehicleRepairForm.invalid) {
      this.openSnackbar('Por favor, completa los campos requeridos.');
      this.vehicleRepairForm.markAllAsTouched();
      return;
    }

    const selectedPatio = this.vehicleRepairForm.get('patio')!.value;

    if (this.isEditMode) {
      // Edit mode - update existing record
      const updateData = {
        vehicle_repair_id: parseInt(this.vehicleRepairId),
        user: this.jwtService.getUserData()?.id,
        patio_id: selectedPatio.id,
        description: this.vehicleRepairForm.value.descripcion || '',
      };

      this.isLoading = true;

      // TODO: Replace with actual API call
      // Simulating API call with timeout
      setTimeout(() => {
        this.isLoading = false;
        this.openSnackbar(
          'Registro actualizado con éxito. Ahora puedes subir las fotos.',
        );
        this.isEditMode = false;
        this.wasEdited = true;
      }, 500);
    } else {
      // Create mode - create new record
      const newVehicleRepairData = {
        user: this.jwtService.getUserData()?.id,
        company_code: this.getCompany(),
        vehicle_number: this.vehicleInfo.numero,
        patio_id: selectedPatio.id,
        patio_name: selectedPatio.nombre,
        description: this.vehicleRepairForm.value.descripcion || '',
        repair_date: this.vehicleInfo.fecha,
        repair_time: this.vehicleInfo.hora,
      };

      this.isLoading = true;

      // TODO: Replace with actual API call
      // Simulating API call with timeout
      setTimeout(() => {
        // Simulate response with ID
        this.vehicleRepairId = Math.floor(Math.random() * 1000).toString();
        this.isLoading = false;
        this.openSnackbar(
          'Registro creado con éxito. Ahora puedes subir las fotos.',
        );
      }, 500);
    }
  }

  uploadImages() {
    if (this.takePhotosRepairComponent) {
      this.isLoading = true;
      this.takePhotosRepairComponent.sendAllPhotos().subscribe({
        next: (response) => {
          this.isLoading = false;
          this.openSnackbar('Todas las fotos se han subido con éxito.');
        },
        error: (err) => {
          this.isLoading = false;
        },
      });
    }
  }

  // Called when user clicks "Subir Fotos" - for now just closes without calling endpoint
  finishAndUpload() {
    // TODO: When API is ready, call uploadImages() here first
    // For now, just close the dialog and refresh
    this.openSnackbar('Registro guardado correctamente.');
    this.closeDialog('refresh');
  }

  finishVehicleRepair() {
    this.closeDialog('refresh');
  }

  closeDialog(result?: string) {
    if (this.takePhotosRepairComponent) {
      this.takePhotosRepairComponent.stopCamera();
    }

    // Refresh if a record was created or edited
    if (this.vehicleRepairId || this.wasEdited) {
      result = 'refresh';
    }

    this.dialogRef.close(result);
  }
}
