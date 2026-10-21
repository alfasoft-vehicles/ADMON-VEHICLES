import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-drivers-resume',
  templateUrl: './drivers-resume.component.html',
  styleUrls: ['./drivers-resume.component.css']
})
export class DriversResumeComponent implements OnInit {
  selectedButton: string = "personal";
  imageDriver: string = "https://www.w3schools.com/howto/img_avatar.png";
  signatureDriver: string = "https://media.istockphoto.com/id/1346710963/es/vector/icono-de-l%C3%ADnea-de-firma-s%C3%ADmbolo-de-firma-digital-reconocimiento-biom%C3%A9trico-de-escritura-a.jpg?s=612x612&w=0&k=20&c=1tSrVg5-N5qSRy7Y52FOtrehtoM54rRNCcNzlPh6gWg=";

  isEditable = false;
  centralFound = false;
  usersFound = false;
  cityFound = false;
  isModalVisible: boolean = false;
  stateEdited = false;
  isLoading = true;

  drivers: any = '';

  data: any = null;
  dataOriginal: any = null;
  cities: any = null;
  central: any = null;
  users: any = null;

  code: string | null = null;
  
  VehiclesDocumentation: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router, 
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.code = params.get('code');
    });
    this.fetchData();
    this.delay(500);
    this.getCities();
    this.getDrivers();
  }

  async delay(ms: number) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  fetchData() {
    this.apiService.getData(`driver/${this.code}`).subscribe(
      (response) => {
        this.data = response;
        this.dataOriginal = { ...this.data };
        this.stateEdited = false;
        this.isLoading = false;
        this.checkCity();
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

  enableInputs() {
    if (this.isEditable) {
      this.disableInputs();
      window.alert('No se ha modificado ningún dato.');
      location.reload();
    }

    this.isEditable = true;
  }

  disableInputs() {
    this.isEditable = false;
  }

  // newData() {
  //   const fields = [
  //     'nombre', 'ciudad', 'telefono', 'celular', 'correo', 'sexo', 'direccion', 'representa', 'estado_civil', 'contacto', 'contacto1', 'contacto2', 'tel_contacto', 'tel_contacto1', 'tel_contacto2', 'par_contacto', 'par_contacto1', 'par_contacto2', 'estado', 'cruce_ahorros', 'licencia_numero', 'licencia_categoria', 'licencia_vencimiento', 'detalle', 'observaciones', 'cedula'
  //   ]
  //   const dataToSave: any = {};
  //   fields.forEach(field => {
  //     const element = document.getElementById(field) as HTMLInputElement;
  //     if (element) {
  //       dataToSave[field] = element.value;
  //     }
  //   });
    
  //   // Add the 'codigo' field which should be read-only
  //   const codigoElement = document.getElementById('codigo') as HTMLInputElement;
  //   if (codigoElement) {
  //     dataToSave['codigo'] = codigoElement.value;
  //   }

  //   return dataToSave;
  // }

  checkModifiedData(): boolean {
    for (const key in this.data) {
      // if(key == 'fec_nacimiento' || key == 'fec_ingreso') {
      //   if(this.data[key] == '') {
      //     this.data[key] = '0000-00-00';
      //   }
      // }
      if (this.data[key] !== this.dataOriginal[key]) {
        if(key == 'estado'){
          this.stateEdited = true;
        }
        return true;
      }
    }
    return false;
  }

  saveData() {

    const modifiedData = this.checkModifiedData();

    if (!modifiedData) {
      window.alert('No se ha modificado ningún dato.');
      this.disableInputs();
      return;
    }

    this.data['stateEdited'] = this.stateEdited;
  
    this.apiService.updateData(`driver/${this.code}`, this.data).subscribe(
      (response) => {
        window.alert('Datos actualizados correctamente');
        this.disableInputs();
        location.reload();
      },
      (error) => {
        console.error(error);
      }
    );
  }

  getDrivers() {
    this.apiService.getData('drivers').subscribe(
      (response) => {
        this.drivers = response
          .filter((drivers: any) => drivers.codigo)  // Filtramos los drivers con código
          .sort((a: any, b: any) => a.codigo - b.codigo); // Ordenamos ascendente por código
      },
      (error) => {
        console.error(error);
      }
    );
  }
  

  nextDriver() {
    const currentIndex = this.drivers.findIndex((driver: any) => driver.codigo === this.code);
    if (currentIndex !== -1 && currentIndex < this.drivers.length - 1) {
      const nextDriverId = this.drivers[currentIndex + 1].codigo;
      this.router.navigate(['/driver/' + nextDriverId]).then(() => {
        window.location.reload();
      });
    }

    if(currentIndex === this.drivers.length - 1){
      this.firstDriver()
    }
  }
  
  backDriver() {
    const currentIndex = this.drivers.findIndex((driver: any) => driver.codigo === this.code);
    if (currentIndex !== -1 && currentIndex > 0) {
      const previousDriverId = this.drivers[currentIndex - 1].codigo;
      this.router.navigate(['/driver/' + previousDriverId]).then(() => {
        window.location.reload();
      });
    }

    if (currentIndex === 0) {
      this.lastDriver()
    }
  }
  

  firstDriver() {
    this.router.navigate(['/driver/' + this.drivers[0].codigo]).then(() => {
      window.location.reload();
    });
  }
  
  lastDriver() {
    this.router.navigate(['/driver/' + this.drivers[this.drivers.length - 1].codigo]).then(() => {
      window.location.reload();
    });
  }

  goToDriverInfo() {
    this.selectButton('personal')
    this.VehiclesDocumentation = false;
  }

  goToDriverGeneral() {
    this.selectButton('general')
    this.VehiclesDocumentation = false;
  }

  goToDriverVehicles() {
    this.selectButton('vehiculos')
    this.VehiclesDocumentation = false;
  }

  goToDriverIncome() {
    this.selectButton('ingresos')
    this.VehiclesDocumentation = false;
  }

  goToDriverOrder() {
    this.selectButton('ordenes')
    this.VehiclesDocumentation = false;
  }

  goToDriverDocuments() {
    this.selectButton('documentacion')
    this.VehiclesDocumentation = true;
  }

  showModal() {
    this.isModalVisible = true;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  hideModal() {
    this.isModalVisible = false;
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }

}
