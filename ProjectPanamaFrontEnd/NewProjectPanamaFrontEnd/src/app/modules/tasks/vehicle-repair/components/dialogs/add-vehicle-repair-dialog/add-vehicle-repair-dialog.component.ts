import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map, Observable, startWith, forkJoin, tap } from 'rxjs';
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
  propietario: string;
}
interface yards {
  id: string;
  name: string;
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

interface VehicleInfoData {
  vehicle_number: string;
  brand: string;
  model: string;
  plate: string;
  vehicle_state: string;
  owner: string;
  quota: string;
  driver_name: string;
  driver_code: string;
  driver_phone: string;
  date: string;
  time: string;
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

  yards: yards[] = [];

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

      if (this.data && this.data.vehicleNumber) {
        this.loadingVehicleInfo = true;
        this.getVehicleInfo(this.data.vehicleNumber);
      }
    }
  }

  getInputsData() {
    this.getDataVehicles();
    this.getYards().subscribe();
  }

  loadVehicleRepairData(vehicleRepairId: string) {
    this.isLoading = true;
    this.resetVehicleInfo();
    this.initForms();

    const company = this.getCompany();

    // Load data in parallel using forkJoin
    forkJoin({
      vehicles: this.apiService.getData('vehicles_data/' + company),
      yards: this.getYards(),
      vehicleRepairData: this.apiService.getData(
        `vehicles_to_repair/get_repair_edit_data/${vehicleRepairId}`,
      ),
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
        this.yards = [...results.yards];

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
    if (data.patio && data.patio.id) {
      const patioMatch = this.yards.find((p) => p.id === data.patio.id);
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
      .getData('vehicles_data/' + company)
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

  getYards(): Observable<yards[]> {
    const company = this.getCompany();
    return this.apiService.getData('yards/' + company).pipe(
      map((data: yards[]) => data.filter((yard) => yard.id && yard.id.trim() !== '')),
      tap((filteredData: yards[]) => {
        this.yards = filteredData;
      }),
    );
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
      .getData(
        'vehicles_to_repair/new_vehicle_entry_data/' + company + '/' + vehicle,
      )
      .subscribe(
        (data: VehicleInfoData) => {
          this.vehicleInfo = {
            numero: data.vehicle_number,
            marca: data.brand,
            modelo: data.model,
            placa: data.plate,
            propietario: data.owner,
            estado_vehiculo: data.vehicle_state,
            cupo: data.quota,
            conductor_nombre: data.driver_name,
            conductor_codigo: data.driver_code,
            conductor_celular: data.driver_phone,
            fecha: data.date,
            hora: data.time,
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

    const selectedYard = this.vehicleRepairForm.get('patio')!.value;

    if (this.isEditMode) {
      // Edit mode - update existing record
      const updateData = {
        user: this.jwtService.getUserData()?.id,
        patio_id: selectedYard.id,
        description: this.vehicleRepairForm.value.descripcion || '',
      };

      this.isLoading = true;

      this.apiService
        .updateData(
          `vehicles_to_repair/update_repair_entry/${this.vehicleRepairId}`,
          updateData,
        )
        .subscribe({
          next: () => {
            this.isLoading = false;
            this.openSnackbar(
              'Registro actualizado con éxito. Ahora puedes subir las fotos.',
            );
            this.isEditMode = false;
            this.wasEdited = true;
          },
          error: (err) => {
            this.isLoading = false;
            this.openSnackbar('Error al actualizar el registro.');
          },
        });
    } else {
      // Create mode - create new record
      const newVehicleRepairData = {
        user: this.jwtService.getUserData()?.id,
        company_code: this.getCompany(),
        vehicle_number: this.vehicleInfo.numero,
        yard: selectedYard.id,
        justify: this.vehicleRepairForm.value.descripcion,
        date: this.vehicleInfo.fecha,
        time: this.vehicleInfo.hora,
      };

      this.isLoading = true;

      this.apiService
        .postData(
          'vehicles_to_repair/create_vehicle_entry',
          newVehicleRepairData,
        )
        .subscribe({
          next: (response: VehicleRepairCreateResponse) => {
            this.isLoading = false;
            this.vehicleRepairId = response.id;
            this.openSnackbar(
              'Registro creado con éxito. Ahora puedes subir las fotos.',
            );
            this.isEditMode = false;
            this.wasEdited = true;
          },
          error: (err) => {
            this.isLoading = false;
          },
        });
    }
  }

  uploadImages() {
    if (this.takePhotosRepairComponent) {
      if (this.takePhotosRepairComponent.photos.length === 0) {
        this.openSnackbar(
          'Realiza la captura de las fotos para guardar el registro',
        );
        return;
      }
      this.isLoading = true;
      this.takePhotosRepairComponent.sendAllPhotos().subscribe({
        next: (response) => {
          this.openSnackbar('Todas las fotos se han subido con éxito.');
          this.openQRPdf();
        },
        error: (err) => {
          this.openSnackbar('Error al subir las fotos.');
          this.isLoading = false;
        },
      });
    }
  }

  openQRPdf() {
    const QRPdfEndpoint = 'vehicles_to_repair/generate_qr/' + this.vehicleRepairId;
    localStorage.setItem('pdfEndpoint', QRPdfEndpoint);
    window.open(`/pdf`, '_blank')
    this.dialogRef.close('refresh');
  }

  finishAndUpload() {
    this.uploadImages();
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
