import { Component } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-drivers-addnew',
  templateUrl: './drivers-addnew.component.html',
  styleUrls: ['./drivers-addnew.component.css']
})
export class DriversAddnewComponent {
  selectedButton: string = "personal";
  imageDriver: string = "https://www.w3schools.com/howto/img_avatar.png";
  signatureDriver: string = "https://media.istockphoto.com/id/1346710963/es/vector/icono-de-l%C3%ADnea-de-firma-s%C3%ADmbolo-de-firma-digital-reconocimiento-biom%C3%A9trico-de-escritura-a.jpg?s=612x612&w=0&k=20&c=1tSrVg5-N5qSRy7Y52FOtrehtoM54rRNCcNzlPh6gWg=";

  isEditable = true;
  centralFound = false;
  usersFound = false;
  cityFound = false;
  isModalVisible: boolean = false;

  drivers: any = '';

  data: any = null;
  cities: any = null;
  central: any = null;
  users: any = null;

  code: string | null = null;

  driverForm: FormGroup;
  
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router, 
    private apiService: ApiService,
    private fb: FormBuilder
  ) {
    this.driverForm = this.fb.group({
      codigo: ['', [Validators.required, Validators.pattern(/^\d{1,12}$/)]], 
      nombre: ['', [Validators.required, Validators.maxLength(50)]],
      cedula: [''],
      ciudad: [''],
      telefono: ['', Validators.pattern(/^\d{1,30}$/)],
      celular: ['', Validators.pattern(/^\d{1,30}$/)],
      correo: ['', Validators.maxLength(40)],
      sexo: [''],
      fecha_ingreso: [''],
      direccion: ['', Validators.maxLength(120)],
      fecha_nacimiento: [''],
      representa: ['', Validators.maxLength(30)],
      estado_civil: [''],
      fecha_retiro: [''],
      contacto: ['', Validators.maxLength(40)],
      contacto1: ['', Validators.maxLength(20)],
      contacto2: ['', Validators.maxLength(20)],
      tel_contacto: ['', Validators.pattern(/^\d{1,40}$/)],
      tel_contacto1: ['', Validators.pattern(/^\d{1,40}$/)],
      tel_contacto2: ['', Validators.pattern(/^\d{1,40}$/)],
      par_contacto: ['', Validators.maxLength(20)],
      par_contacto1: ['', Validators.maxLength(20)],
      par_contacto2: ['', Validators.maxLength(20)],
      recome_nom: ['', Validators.maxLength(50)],
      recome_ced: ['', Validators.maxLength(12)],
      estado: [''],
      contrato_auto: [''],
      cruce_ahorros: [''],
      licencia_numero: ['', Validators.maxLength(12)],
      licencia_categoria: ['', Validators.maxLength(2)],
      licencia_vencimiento: [''],
      detalle: ['', Validators.maxLength(50)],
      observaciones: ['', Validators.maxLength(50)],
    });
  }

  ngOnInit(): void {
    this.driverForm.get('codigo')?.disable();
    this.fetchData();
    this.delay(500);
    this.getCities();
    this.getDrivers();
  }

  async delay(ms: number) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  fetchData() {
    this.apiService.getData(`owner/26`).subscribe(
      (response) => {
        this.data = response;
      },
      (error) => {
        console.error(error);
        
      }
    );
  }

  getCities() {
    this.apiService.getData('cities').subscribe(
      (response) => {
        this.cities = response;
        this.checkCity();
      },
      (error) => {
        console.error(error);
      }
    );
  }

  checkCity() {
    if (this.data && this.cities) {
      this.cityFound = this.cities.some((city: any) => city.codigo === this.data.ciudad);
      if (!this.cityFound) {
        this.cities.push({
          codigo: this.data.ciudad,
          nombre: "Ciudad no encontrada"
        });
      }
    }
  }

  selectButton(button: string) {
    this.selectedButton = button;
  }

  goToDriverInfo() {
    this.selectButton('personal')
  }

  goToDriverGeneral() {
    this.selectButton('general')
  }

  goToDriverVehicles() {
    this.selectButton('vehiculos')
  }

  goToDriverIncome() {
    this.selectButton('ingresos')
  }

  goToDriverDocuments() {
    this.selectButton('documentacion')
  }

  addDateFields(): void {
    const dateFields = [
      'fecha_nacimiento',
      'fecha_retiro',
      'fecha_inicio',
      'fecha_prestamo',
      'fecha_devolucion',
      'fecha_siniestro',
      'licencia_vencimiento',
      'fecha_ingreso',
      'fecha_tarjeta',
      'fecha_1pago',
      'fecha_ultpago',
      'fecha_extencion',
    ];

    dateFields.forEach(field => {
      if (!this.driverForm.get(field) || !this.driverForm.get(field)?.value) {
        this.driverForm.addControl(field, this.fb.control('0000-00-00', Validators.required));
      }
    });
  }

  getDrivers() {
    this.apiService.getData('driver-codes').subscribe(
      (response) => {
        this.drivers = response.filter((drivers: any) => drivers).sort((a: any, b: any) => parseInt(a, 10) - parseInt(b, 10));
        this.asignCode();
      },
      (error) => {
        console.error(error);
      }
    );
  }

  checkCode(): boolean {
    const code = this.driverForm.get('codigo')?.value;
    this.code = code;
    if (code !== null && code !== undefined && code !== '') {
      const owner = this.drivers.find((owner: any) => owner === code.toString());
      if (owner) {
        window.alert('El código ya existe.');
        this.driverForm.get('codigo')?.setValue('');
        return false;
      }
      return true;
    }
    return false;
  }

  asignCode() {
    const code = parseInt(this.drivers[this.drivers.length - 1],10) + 1;
    this.driverForm.get('codigo')?.setValue(code);
  }

  onSubmit() {
    if (this.driverForm.valid) {
      if (this.checkCode()){
        this.isLoading = false;
        this.addDateFields();
        const formData = this.driverForm.value;
        formData['codigo'] = this.driverForm.get('codigo')?.value;
        this.apiService.postData('drivers', formData).subscribe(
          (response) => {
            window.alert('Propietario creado exitosamente.');
            this.driverForm.reset();
            this.router.navigate(['/driver/'+this.code]);
          },
          (error) => {
            console.error(error);
          }
        );
      }
    }
    else {
      window.alert('Por favor, llene los campos correctamente.');
    }
  }

}
