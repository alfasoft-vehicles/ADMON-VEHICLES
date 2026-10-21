import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-vehicles-addnew',
  templateUrl: './vehicles-addnew.component.html',
  styleUrls: ['./vehicles-addnew.component.css']
})
export class VehiclesAddnewComponent {
  vehicleForm: FormGroup;

  selectedButton: string = "propiedad";
  imageVehicle: string = "https://cdn5.dibujos.net/dibujos/pintados/202013/coche-urbano-vehiculos-coches-11735143.jpg";

  isEditable = false;
  centralFound = false;
  usersFound = false;
  cityFound = false;
  isModalVisible: boolean = false;
  hasPermission: boolean = false;
  grantedPermission: string = '';
  stateEdited = false;

  // drivers: any = '';

  data: any = null;
  dataOriginal: any = null;
  central: any = null;
  brands: any = null;
  owners: any = null;
  users: any = null;
  vehicles: any = null;
  expenseAccounts: any = null;
  modalities: any = null;

  code: string | null = null;

  createDate: string = '';

  isLoading = true;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router, 
    private apiService: ApiService
  ) {
    this.vehicleForm = this.fb.group({
      vehiculo_placa: ['', [Validators.required, Validators.maxLength(8)]],
      vehiculo_numero: ['', Validators.maxLength(8)],
      vehiculo_marca: [''],
      vehiculo_modelo: ['', Validators.maxLength(25)],
      vehiculo_fec_modelo: ['', [Validators.min(1900), Validators.max(2100)]],
      vehiculo_cilindraje: ['', Validators.maxLength(4)],
      vehiculo_nro_puertas: ['', Validators.pattern(/^\d$/)],
      vehiculo_licencia_nro: ['', Validators.maxLength(20)],
      vehiculo_licencia_fec: [''],
      vehiculo_color: ['', Validators.maxLength(20)],
      vehiculo_servicio: ['', Validators.maxLength(30)],
      vehiculo_fec_matricula: [''],
      vehiculo_clase: ['', Validators.maxLength(30)],
      vehiculo_capacidad: ['', Validators.pattern(/^\d{1,8}$/)],
      vehiculo_fec_vencimiento_matricula: [''],
      vehiculo_tipo: ['', Validators.maxLength(30)],
      vehiculo_ne: ['', Validators.maxLength(3)],
      vehiculo_fec_importacion: [''],
      vehiculo_combustible: ['', Validators.maxLength(20)],
      vehiculo_vin: ['', Validators.maxLength(20)],
      vehiculo_motor: ['', Validators.maxLength(20)],
      vehiculo_serie: ['', Validators.maxLength(20)],
      vehiculo_chasis: ['', Validators.maxLength(20)],
      vehiculo_motor_reg: ['', Validators.maxLength(3)],
      vehiculo_serie_reg: ['', Validators.maxLength(3)],
      vehiculo_chasis_reg: ['', Validators.maxLength(3)],
      vehiculo_propietario: [''],
      vehiculo_cta_gasto: [''],
      vehiculo_central: [''],
      vehiculo_nro_cupo: ['', Validators.maxLength(12)],
      vehiculo_permiso_nro: ['', Validators.maxLength(12)],
      vehiculo_fec_vencimiento_permiso: [''],
      vehiculo_blindaje: ['', Validators.maxLength(15)],
      vehiculo_potencia: ['', Validators.maxLength(6)],
      vehiculo_dec_importacion: ['', Validators.maxLength(20)],
      vehiculo_restriccion_movilidad: [''],
      vehiculo_limit_propiedad: ['', Validators.maxLength(80)],
      vehiculo_organismo_transito: ['', Validators.maxLength(50)],
      vehiculo_codigo_barras: ['', Validators.maxLength(18)],
      vehiculo_lateral: ['', Validators.maxLength(8)],
      vehiculo_kilometraje: ['', Validators.pattern(/^\d{1,6}(\.\d{1,2})?$/)],
      vehiculo_modalidad: [''],
      vehiculo_consulta_panapass: [''],
      vehiculo_panapass: ['', Validators.maxLength(12)],
      vehiculo_panapass_pwd: ['', Validators.maxLength(12)],
    });
  }

  ngOnInit(): void {
    this.getBrands();
    this.getOwners();
    this.getCentral();
    this.getExpenseAccounts();
    this.getModalities();
    this.getVehicles();
  }

  getBrands() {
    this.apiService.getData('brands').subscribe(
      (response) => {
        this.brands = response;
      },
      (error) => {
        console.error(error);
      }
    );
  }

  getModalities() {
    this.apiService.getData('modalities').subscribe(
      (response) => {
        this.modalities = response;
      },
      (error) => {
        console.error(error);
      }
    );
  }

  // TODO: Arreglar llamado al endpoint por nuevo
  getOwners() {
    this.apiService.getData('owners').subscribe(
      (response) => {
        this.owners = response;
      },
      (error) => {
        console.error(error);
      }
    );
  }

  getCentral() {
    this.apiService.getData('central').subscribe(
      (response) => {
        this.central = response;
      },
      (error) => {
        console.error(error);
      }
    );
  }

  getExpenseAccounts() {
    this.apiService.getData('expense-accounts').subscribe(
      (response) => {
        this.expenseAccounts = response;
      },
      (error) => {
        console.error(error);
      }
    );
  }

  selectButton(button: string) {
    this.selectedButton = button;
  }

  finalDate(fecha: string): string {
    if (fecha) {
      return `${fecha} 00:00:00`; // Añade la hora "00:00:00" al final de la fecha
    }
    return '0000-00-00 00:00:00'; // Si la fecha no es válida, devuelve una fecha nula
  }

  getVehicles() {
    this.apiService.getData('vehicle-codes').subscribe(
      (response) => {
        this.vehicles = response
          .sort((a: any, b: any) => a.vehiculo_consecutivo - b.vehiculo_consecutivo);  // Ordenamos los drivers por código
        
      },
      (error) => {
        console.error(error);
      }
    );
  }

  saveData() {

    if(this.vehicleForm.invalid) {
      this.vehicleForm.markAllAsTouched();
      window.alert('Por favor, rellene todos los campos obligatorios');
      return;
    }

    const formValues = this.vehicleForm.value;

    // this.data['stateEdited'] = this.stateEdited;

    formValues.vehiculo_licencia_fec = this.finalDate(formValues.vehiculo_licencia_fec);
    formValues.vehiculo_fec_importacion = this.finalDate(formValues.vehiculo_fec_importacion);
    formValues.vehiculo_fec_vencimiento_matricula = this.finalDate(formValues.vehiculo_fec_vencimiento_matricula);
    formValues.vehiculo_fec_matricula = this.finalDate(formValues.vehiculo_fec_matricula);

    formValues.vehiculo_consecutivo = Number(this.vehicles[this.vehicles.length - 1].vehiculo_consecutivo) + 1;

    this.isLoading = false;
  
    this.apiService.postData(`vehicles`, formValues).subscribe(
      (response) => {
        window.alert('Vehículo creado correctamente');
        this.router.navigate(['/vehicle/'+formValues.vehiculo_consecutivo]);
      },
      (error) => {
        console.error(error);
      }
    );
  }

  goToVehicleOwnership() {
    this.selectButton('propiedad')
  }

  goToVehicleDocuments() {
    this.selectButton('documentos')
  }

  goToVehicleDrivers() {
    this.selectButton('conductores')
  }

  goToVehicleIncome() {
    this.selectButton('ingresos')
  }

  goToVehicleOrders() {
    this.selectButton('ordenes')
  }

  goToVehicleTools() {
    this.selectButton('herramientas')
  }

  goToVehiclePhotos() {
    this.selectButton('fotos')
  }

  goToVehicleDocumentation() {
    this.selectButton('documentacion')
  }

  goToVehiclePyG() {
    this.selectButton('pyg')
  }

}
