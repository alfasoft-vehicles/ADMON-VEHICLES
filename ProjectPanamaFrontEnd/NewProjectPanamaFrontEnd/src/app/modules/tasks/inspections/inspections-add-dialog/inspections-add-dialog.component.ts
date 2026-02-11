import {
  AfterViewInit,
  Component,
  Inject,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map, Observable, startWith, forkJoin } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { JwtService } from 'src/app/services/jwt.service';
import { VehicleStatesFormComponent } from '../inspections-forms/vehicle-states-form/vehicle-states-form.component';
import { TakePhotosVehicleComponent } from '../take-photos-vehicle/take-photos-vehicle.component';
import { SignaturePadComponent } from 'src/app/modules/shared/components/signature-pad/signature-pad.component';

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

interface InspectionTypes {
  id: string;
  nombre: string;
  tipo: string;
}

interface InspectionsVehicleData {
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
  kilometraje: number;
  fecha_inspeccion: string;
  hora_inspeccion: string;
  panapass: number;
}

interface ChecklistItem {
  id: string;
  label: string;
  value: boolean | null;
}

interface InspectionCreateResponse {
  id: string;
}

@Component({
  selector: 'app-inspections-add-dialog',
  templateUrl: './inspections-add-dialog.component.html',
  styleUrls: ['./inspections-add-dialog.component.css'],
})
export class InspectionsAddDialogComponent implements OnInit {
  @ViewChild(VehicleStatesFormComponent)
  set vehicleStatesFormComponent(component: VehicleStatesFormComponent) {
    if (component) {
      setTimeout(() => {
        this.mainInspectionForm.addControl(
          'vehicleState',
          component.vehicleForm,
        );
      }, 0);
    }
  }

  @ViewChild(TakePhotosVehicleComponent)
  takePhotosVehicleComponent!: TakePhotosVehicleComponent;

  @ViewChild(SignaturePadComponent)
  signaturePadComponent!: SignaturePadComponent;

  inspectionInfoForm!: FormGroup;

  mainInspectionForm!: FormGroup;

  isLoading: boolean = true;

  vehicles: Vehicles[] = [];
  optionsVehicles!: Observable<Vehicles[]>;

  inspectionTypes: InspectionTypes[] = [];

  loadingVehicleInfo: boolean = false;
  selectedVehicle: boolean = false;

  inspectionType: string = '';

  vehicleInfo!: InspectionsVehicleData;

  inspectionCreateID: string = '';

  showCompactView: boolean = false;

  isEditMode: boolean = false;
  inspectionData: any = null;
  wasEdited: boolean = false;

  showSignaturePad: boolean = false;
  signatureBase64: string = '';

  preselectedVehicleNumber: string = '';

  constructor(
    private apiService: ApiService,
    private jwtService: JwtService,
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<InspectionsAddDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      idInspection: string;
      idTypeInspection: string;
      vehicleNumber: string;
    },
  ) {}

  ngOnInit(): void {
    if (this.data && this.data.idInspection) {
      // Si hay idTypeInspection, significa que solo quiere subir fotos (flujo antiguo)
      if (this.data.idTypeInspection) {
        this.inspectionCreateID = this.data.idInspection;
        this.inspectionType = this.data.idTypeInspection;
        this.isLoading = false;
        return;
      }

      // Si no hay idTypeInspection, es modo edición (nuevo flujo)
      this.isEditMode = true;
      this.inspectionCreateID = this.data.idInspection;
      this.loadInspectionData(this.data.idInspection);
    } else {
      // Modo creación
      if (this.data && this.data.vehicleNumber) {
        this.preselectedVehicleNumber = this.data.vehicleNumber;
      }
      this.getInputsData();
      this.resetVehicleInfo();
      this.initForms();
    }
  }

  getInputsData() {
    this.getDataVehicles();
    this.getInspectionTypes();
  }

  loadInspectionData(inspectionId: string) {
    this.isLoading = true;
    this.resetVehicleInfo();
    this.initForms();

    const company = this.getCompany();

    // Cargar datos en paralelo usando forkJoin
    forkJoin({
      vehicles: this.apiService.getData('inspections/vehicles_data/' + company),
      inspectionTypes: this.apiService.getData(
        'inspections/inspection_types/' + company,
      ),
      inspectionData: this.apiService.getData(
        'inspections/inspection_details/' + inspectionId,
      ),
      mechanics: this.apiService.getData('mechanics/' + company),
    }).subscribe(
      (results: any) => {
        // Guardar vehículos
        this.vehicles = [...results.vehicles];
        this.optionsVehicles = this.inspectionInfoForm
          .get('vehiculo')!
          .valueChanges.pipe(
            startWith(''),
            map((value) => this._filterVehicles(value || '')),
          );

        // Guardar tipos de inspección
        this.inspectionTypes = [...results.inspectionTypes];

        // Guardar datos de inspección
        this.inspectionData = results.inspectionData;

        // Ahora sí, poblar el formulario con los datos
        this.populateFormWithInspectionData(
          results.inspectionData,
          results.mechanics,
        );

        this.isLoading = false;
      },
      (error) => {
        console.error('Error al cargar datos de inspección:', error);
        this.openSnackbar('Error al cargar los datos de la inspección.');
        this.isLoading = false;
        this.closeDialog();
      },
    );
  }

  populateFormWithInspectionData(
    data: any,
    mechanics: { code: string; name: string }[] = [],
  ) {
    // Precargar información del vehículo
    this.vehicleInfo = {
      numero: data.unidad,
      marca: '',
      modelo: '',
      placa: data.placa,
      estado_vehiculo: data.estado_vehiculo,
      propietario: data.propietario,
      cupo: data.cupo,
      conductor_nombre: data.nombre_conductor,
      conductor_codigo: data.conductor,
      conductor_celular: '',
      kilometraje: data.kilometraje,
      fecha_inspeccion: data.fecha,
      hora_inspeccion: data.hora,
      panapass: data.panapass,
    };

    // Buscar el vehículo en la lista de vehículos para preseleccionarlo
    const vehicleMatch = this.vehicles.find(
      (v) => v.numero_unidad === data.unidad,
    );

    if (vehicleMatch) {
      this.inspectionInfoForm.patchValue({
        vehiculo: vehicleMatch,
      });
      this.selectedVehicle = true;
    }

    // Buscar el tipo de inspección para preseleccionarlo
    const inspectionTypeMatch = this.inspectionTypes.find(
      (t) => t.nombre === data.tipo_inspeccion,
    );

    if (inspectionTypeMatch) {
      this.inspectionInfoForm.patchValue({
        tipo_inspeccion: inspectionTypeMatch,
      });
      this.inspectionType = inspectionTypeMatch.tipo;
    }

    let mechanicMatch: { code: string; name: string } | undefined;
    if (data.mecanico && mechanics.length > 0) {
      const mechanicParts = data.mecanico.split(' - ');
      if (mechanicParts.length >= 2) {
        const mechanicCode = mechanicParts[0].trim();
        mechanicMatch = mechanics.find((m) => m.code === mechanicCode);
      }
    }

    // Activar vista compacta
    this.showCompactView = true;

    // Esperar a que el formulario de estados del vehículo esté listo
    setTimeout(() => {
      if (this.mainInspectionForm.get('vehicleState')) {
        const vehicleStateForm = this.mainInspectionForm.get('vehicleState');

        // Precargar valores del formulario de estados
        vehicleStateForm?.patchValue({
          combustible: data.combustible,
          kilometraje: data.kilometraje,
          panapass: data.panapass,
          descripcion: data.descripcion,
          nota: data.observaciones,
        });

        // Precargar el mecánico si se encontró
        if (mechanicMatch) {
          vehicleStateForm?.patchValue({
            mecanico: mechanicMatch,
          });
        }

        // Precargar checklist items
        const checklistArray = vehicleStateForm?.get('checklistItems') as any;
        if (checklistArray && checklistArray.controls) {
          checklistArray.controls.forEach((control: any, index: number) => {
            const itemId = control.get('id')?.value;
            let value = null;

            switch (itemId) {
              case 'alfombra':
                value = data.alfombra;
                break;
              case 'antena':
                value = data.antena;
                break;
              case 'caratula_radio':
                value = data.caratradio;
                break;
              case 'copas':
                value = false; // No existe en el modelo
                break;
              case 'copas_rines':
                value = data.copasrines;
                break;
              case 'extinguidor':
                value = data.extinguidor;
                break;
              case 'formato_colisiones_menores':
                value = data.formatocolis;
                break;
              case 'gato':
                value = data.gato;
                break;
              case 'gps':
                value = data.gps;
                break;
              case 'lamparas':
                value = data.lamparas;
                break;
              case 'llanta_repuesto':
                value = data.llantarepu;
                break;
              case 'luces_delanteras':
                value = data.luzdelante;
                break;
              case 'luces_traseras':
                value = data.luztracera;
                break;
              case 'pago_municipio':
                value = data.pagomunici;
                break;
              case 'pipa':
                value = data.pipa;
                break;
              case 'placa_municipal':
                value = data.placamunic;
                break;
              case 'poliza_seguro':
                value = data.poliseguro;
                break;
              case 'registro_vehiculo':
                value = data.regisvehic;
                break;
              case 'retrovisor':
                value = data.retrovisor;
                break;
              case 'revisado':
                value = data.revisado;
                break;
              case 'tapiceria':
                value = data.tapiceria;
                break;
              case 'triangulo':
                value = data.triangulo;
                break;
              case 'vidrios':
                value = data.vidrios;
                break;
            }

            if (value !== null) {
              control.patchValue({ value: value });
            }
          });
        }
      }
    }, 500);
  }

  initForms(): void {
    this.inspectionInfoForm = this.formBuilder.group({
      vehiculo: ['', Validators.required],
      tipo_inspeccion: ['', Validators.required],
    });

    this.mainInspectionForm = this.formBuilder.group({
      inspectionInfo: this.inspectionInfoForm,
    });

    this.inspectionInfoForm.get('tipo_inspeccion')?.markAsTouched();
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
        this.optionsVehicles = this.inspectionInfoForm
          .get('vehiculo')!
          .valueChanges.pipe(
            startWith(''),
            map((value) => this._filterVehicles(value || '')),
          );

        // Si hay un vehículo preseleccionado, buscarlo y cargarlo automáticamente
        if (this.preselectedVehicleNumber) {
          const foundVehicle = this.vehicles.find(
            (v) => v.numero_unidad === this.preselectedVehicleNumber,
          );
          if (foundVehicle) {
            this.inspectionInfoForm.patchValue({ vehiculo: foundVehicle });
            this.getVehicleInfo(foundVehicle.numero_unidad);
          }
        }

        this.isLoading = false;
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

  getInspectionTypes() {
    const company = this.getCompany();
    this.apiService
      .getData('inspections/inspection_types/' + company)
      .subscribe(
        (data: InspectionTypes[]) => {
          this.inspectionTypes = [...data];
        },
        (error) => {
          console.error('Error fetching inspection types:', error);
        },
      );
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
      kilometraje: 0,
      fecha_inspeccion: '',
      hora_inspeccion: '',
      panapass: 0,
    };

    this.inspectionType = '';
    this.showCompactView = false; // Resetear vista compacta
  }

  selectedOptionVehicle(event: MatAutocompleteSelectedEvent): void {
    this.resetVehicleInfo();
    this.selectedVehicle = false;

    const selectedVehicle = event.option.value.numero_unidad;

    if (selectedVehicle) {
      this.loadingVehicleInfo = true;
      this.getVehicleInfo(selectedVehicle);
    } else {
      this.inspectionInfoForm.get('vehiculo')?.reset('');
      this.inspectionType = '';
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
        (data: InspectionsVehicleData) => {
          this.vehicleInfo = data;
          this.loadingVehicleInfo = false;
          this.selectedVehicle = true;
        },
        (error) => {
          console.error('Error fetching vehicle info:', error);
          this.openSnackbar(
            'error al obtener la información del vehículo seleccionado. Vuelve a intentarlo más tarde.',
          );
          this.loadingVehicleInfo = false;
          this.selectedVehicle = false;
        },
      );
  }

  startInspection() {
    if (this.inspectionInfoForm.invalid || !this.selectedVehicle) {
      this.openSnackbar('Por favor, completa los campos requeridos.');
      this.inspectionInfoForm.markAllAsTouched();
      return;
    }

    const InspectionsSelectedType =
      this.inspectionInfoForm.get('tipo_inspeccion')!.value;

    this.inspectionType = InspectionsSelectedType.tipo;
    this.showCompactView = true; // Activar vista compacta
  }

  onSaveOrNext() {
    if (this.mainInspectionForm.invalid) {
      this.openSnackbar('Por favor, completa los campos requeridos.');

      this.mainInspectionForm.markAllAsTouched();
      return;
    }

    const checklistItems: ChecklistItem[] =
      this.mainInspectionForm.value.vehicleState.checklistItems;

    if (this.isEditMode) {
      // Modo edición
      const updateInspectionData = {
        inspection_id: parseInt(this.inspectionCreateID),
        user: this.jwtService.getUserData()?.id,
        mileage: this.mainInspectionForm.value.vehicleState.kilometraje || 0,
        inspection_type:
          this.mainInspectionForm.value.inspectionInfo.tipo_inspeccion.id,
        mechanic_code: this.mainInspectionForm.value.vehicleState.mecanico.code,
        alfombra: checklistItems.find((item) => item.id === 'alfombra')?.value
          ? 1
          : 0,
        copas_rines: checklistItems.find((item) => item.id === 'copas_rines')
          ?.value
          ? 1
          : 0,
        extinguidor: checklistItems.find((item) => item.id === 'extinguidor')
          ?.value
          ? 1
          : 0,
        antena: checklistItems.find((item) => item.id === 'antena')?.value
          ? 1
          : 0,
        lamparas: checklistItems.find((item) => item.id === 'lamparas')?.value
          ? 1
          : 0,
        triangulo: checklistItems.find((item) => item.id === 'triangulo')?.value
          ? 1
          : 0,
        gato: checklistItems.find((item) => item.id === 'gato')?.value ? 1 : 0,
        pipa: checklistItems.find((item) => item.id === 'pipa')?.value ? 1 : 0,
        copas: checklistItems.find((item) => item.id === 'copas')?.value
          ? 1
          : 0,
        llanta_repuesto: checklistItems.find(
          (item) => item.id === 'llanta_repuesto',
        )?.value
          ? 1
          : 0,
        placa_municipal: checklistItems.find(
          (item) => item.id === 'placa_municipal',
        )?.value
          ? 1
          : 0,
        caratula_radio: checklistItems.find(
          (item) => item.id === 'caratula_radio',
        )?.value
          ? 1
          : 0,
        registro_vehiculo: checklistItems.find(
          (item) => item.id === 'registro_vehiculo',
        )?.value
          ? 1
          : 0,
        revisado: checklistItems.find((item) => item.id === 'revisado')?.value
          ? 1
          : 0,
        pago_municipio: checklistItems.find(
          (item) => item.id === 'pago_municipio',
        )?.value
          ? 1
          : 0,
        formato_colisiones_menores: checklistItems.find(
          (item) => item.id === 'formato_colisiones_menores',
        )?.value
          ? 1
          : 0,
        poliza_seguros: checklistItems.find(
          (item) => item.id === 'poliza_seguro',
        )?.value
          ? 1
          : 0,
        luces_delanteras: checklistItems.find(
          (item) => item.id === 'luces_delanteras',
        )?.value
          ? 1
          : 0,
        luces_traseras: checklistItems.find(
          (item) => item.id === 'luces_traseras',
        )?.value
          ? 1
          : 0,
        vidrios: checklistItems.find((item) => item.id === 'vidrios')?.value
          ? 1
          : 0,
        retrovisor: checklistItems.find((item) => item.id === 'retrovisor')
          ?.value
          ? 1
          : 0,
        tapiceria: checklistItems.find((item) => item.id === 'tapiceria')?.value
          ? 1
          : 0,
        gps: checklistItems.find((item) => item.id === 'gps')?.value ? 1 : 0,
        combustible:
          this.mainInspectionForm.value.vehicleState.combustible || '',
        panapass: this.mainInspectionForm.value.vehicleState.panapass || '',
        description:
          this.mainInspectionForm.value.vehicleState.descripcion || '',
        nota: this.mainInspectionForm.value.vehicleState.nota || '',
      };

      this.isLoading = true;

      this.apiService
        .updateData('inspections/update_inspection', updateInspectionData)
        .subscribe(
          (response: any) => {
            this.isLoading = false;
            this.openSnackbar(
              'Inspección actualizada con éxito. Ahora puedes subir las fotos.',
            );
            // Cambiar a modo de subir fotos
            this.isEditMode = false;
            this.wasEdited = true;
            // El inspectionCreateID ya tiene el valor correcto
          },
          (error: any) => {
            console.error('Error al actualizar la inspección:', error);
            this.openSnackbar(
              error.error?.message ||
                'Error al actualizar la inspección. Vuelve a intentarlo más tarde.',
            );
            this.isLoading = false;
          },
        );
    } else {
      // Modo creación
      const newInspectionData = {
        user: this.jwtService.getUserData()?.id,
        company_code: this.getCompany(),
        vehicle_number: this.vehicleInfo.numero,
        mechanic_code: this.mainInspectionForm.value.vehicleState.mecanico.code || '',
        mileage: this.mainInspectionForm.value.vehicleState.kilometraje || 0,
        inspection_type:
          this.mainInspectionForm.value.inspectionInfo.tipo_inspeccion.id,
        inspection_date: this.vehicleInfo.fecha_inspeccion,
        inspection_time: this.vehicleInfo.hora_inspeccion,
        alfombra: checklistItems.find((item) => item.id === 'alfombra')?.value
          ? 1
          : 0,
        copas_rines: checklistItems.find((item) => item.id === 'copas_rines')
          ?.value
          ? 1
          : 0,
        extinguidor: checklistItems.find((item) => item.id === 'extinguidor')
          ?.value
          ? 1
          : 0,
        antena: checklistItems.find((item) => item.id === 'antena')?.value
          ? 1
          : 0,
        lamparas: checklistItems.find((item) => item.id === 'lamparas')?.value
          ? 1
          : 0,
        triangulo: checklistItems.find((item) => item.id === 'triangulo')?.value
          ? 1
          : 0,
        gato: checklistItems.find((item) => item.id === 'gato')?.value ? 1 : 0,
        pipa: checklistItems.find((item) => item.id === 'pipa')?.value ? 1 : 0,
        copas: checklistItems.find((item) => item.id === 'copas')?.value
          ? 1
          : 0,
        llanta_repuesto: checklistItems.find(
          (item) => item.id === 'llanta_repuesto',
        )?.value
          ? 1
          : 0,
        placa_municipal: checklistItems.find(
          (item) => item.id === 'placa_municipal',
        )?.value
          ? 1
          : 0,
        caratula_radio: checklistItems.find(
          (item) => item.id === 'caratula_radio',
        )?.value
          ? 1
          : 0,
        registro_vehiculo: checklistItems.find(
          (item) => item.id === 'registro_vehiculo',
        )?.value
          ? 1
          : 0,
        revisado: checklistItems.find((item) => item.id === 'revisado')?.value
          ? 1
          : 0,
        pago_municipio: checklistItems.find(
          (item) => item.id === 'pago_municipio',
        )?.value
          ? 1
          : 0,
        formato_colisiones_menores: checklistItems.find(
          (item) => item.id === 'formato_colisiones_menores',
        )?.value
          ? 1
          : 0,
        poliza_seguros: checklistItems.find(
          (item) => item.id === 'poliza_seguro',
        )?.value
          ? 1
          : 0,
        luces_delanteras: checklistItems.find(
          (item) => item.id === 'luces_delanteras',
        )?.value
          ? 1
          : 0,
        luces_traseras: checklistItems.find(
          (item) => item.id === 'luces_traseras',
        )?.value
          ? 1
          : 0,
        vidrios: checklistItems.find((item) => item.id === 'vidrios')?.value
          ? 1
          : 0,
        retrovisor: checklistItems.find((item) => item.id === 'retrovisor')
          ?.value
          ? 1
          : 0,
        tapiceria: checklistItems.find((item) => item.id === 'tapiceria')?.value
          ? 1
          : 0,
        gps: checklistItems.find((item) => item.id === 'gps')?.value ? 1 : 0,
        combustible:
          this.mainInspectionForm.value.vehicleState.combustible || '',
        panapass: this.mainInspectionForm.value.vehicleState.panapass || '',
        description:
          this.mainInspectionForm.value.vehicleState.descripcion || '',
        nota: this.mainInspectionForm.value.vehicleState.nota || '',
      };

      this.isLoading = true;

      this.apiService
        .postData('inspections/create_inspection', newInspectionData)
        .subscribe(
          (response: InspectionCreateResponse) => {
            this.inspectionCreateID = response.id;
            this.isLoading = false;
            this.openSnackbar('Inspección creada con éxito.');
          },
          (error) => {
            console.error('Error al crear la inspección:', error);
            this.openSnackbar(
              'Error al crear la inspección. Vuelve a intentarlo más tarde.',
            );
            this.closeDialog();
          },
        );
    }
  }

  uploadImages() {
    if (this.takePhotosVehicleComponent) {
      this.isLoading = true;
      this.takePhotosVehicleComponent.sendAllPhotos().subscribe({
        next: (response) => {
          this.isLoading = false;
          this.openSnackbar('Todas las fotos se han subido con éxito.');
          // Mostrar el pad de firma después de subir las fotos
          this.showSignaturePad = true;
        },
        error: (err) => {
          this.isLoading = false;
        },
      });
    }
  }

  onSignatureSaved(signatureBase64: string) {
    this.signatureBase64 = signatureBase64;

    // Convertir base64 a Blob
    const base64Data = signatureBase64.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });

    // Crear FormData y agregar la firma
    const formData = new FormData();
    formData.append('signature', blob, `firma_${this.inspectionCreateID}.png`);

    // Enviar la firma al backend
    this.isLoading = true;
    this.apiService
      .postData(
        `inspections/upload_signature/${this.inspectionCreateID}`,
        formData,
      )
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;
          this.openSnackbar('Firma guardada correctamente.');
          this.closeDialog('refresh');
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error al guardar la firma:', error);
          this.openSnackbar(
            'Error al guardar la firma. Vuelve a intentarlo más tarde.',
          );
        },
      });
  }

  saveInspectionSignature() {
    if (this.signaturePadComponent) {
      this.signaturePadComponent.saveSignature();
    }
  }

  closeDialog(result?: string) {
    if (this.takePhotosVehicleComponent) {
      this.takePhotosVehicleComponent.stopCamera();
    }

    // Refrescar si se creó una inspección o si se editó
    if (this.inspectionCreateID || this.wasEdited) {
      result = 'refresh';
    }

    this.dialogRef.close(result);
  }
}
