import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-vehicles-resume',
  templateUrl: './vehicles-resume.component.html',
  styleUrls: ['./vehicles-resume.component.css']
})
export class VehiclesResumeComponent {
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
  isLoading = true;

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
    this.modifyUnity();
    this.fetchData();
    this.delay(500);
    this.getVehicles();
    this.getBrands();
    this.getOwners();
    this.getCentral();
    this.getExpenseAccounts();
    this.getModalities();
  }

  async delay(ms: number) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  fetchData() {
    this.apiService.getData(`vehicle/`+this.code).subscribe(
      (response) => {
        this.data = response;
        this.stateEdited = false;
        this.formatDate(this.data.vehiculo_fec_creacion);
        this.data.vehiculo_licencia_fec = this.changeDate(this.data.vehiculo_licencia_fec);
        this.data.vehiculo_fec_importacion = this.changeDate(this.data.vehiculo_fec_importacion);
        this.data.vehiculo_fec_vencimiento_matricula = this.changeDate(this.data.vehiculo_fec_vencimiento_matricula);
        this.data.vehiculo_fec_matricula = this.changeDate(this.data.vehiculo_fec_matricula);
        this.dataOriginal = { ...this.data };
        this.isLoading = false;
        this.checkBrand();
        // this.checkExpenseAccount();
      },
      (error) => {
        console.error(error);
        
      }
    );
  }

  formatDate(fecha: string) {
    const date = new Date(fecha);
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };
    this.createDate = date.toLocaleString('es-ES', options).replace(',', '');
  }

  changeDate(fecha: string): string {
    // Validar que la fecha no sea nula ni tenga el valor "0000-00-00"
    if (fecha && fecha !== '0000-00-00') {
        // Si la fecha tiene el formato 'YYYY-MM-DDTHH:MM:SS', separamos la parte de la fecha
        const partes = fecha.split('T');
        return partes[0]; // Retorna solo la parte de la fecha "YYYY-MM-DD"
    }
    return ''; // Si la fecha no es válida o es "0000-00-00", devolver cadena vacía
}

  // Función para convertir la fecha de "YYYY-MM-DD" a "YYYY-MM-DD 00:00:00"
  finalDate(fecha: string): string {
    if (fecha) {
      return `${fecha} 00:00:00`; // Añade la hora "00:00:00" al final de la fecha
    }
    return '0000-00-00 00:00:00'; // Si la fecha no es válida, devuelve una fecha nula
  }

  modifyUnity() {
    this.apiService.getData("verify-vehicle-delete/"+this.code).subscribe(
      (response) => {

        for (const [key, value] of Object.entries(response)) {
          if (value === true) {
            this.hasPermission = true;
            this.grantedPermission = key;
            break; 
          }
        }
      },
      (error) => {
      }
    );
  }

  getBrands() {
    this.apiService.getData('brands').subscribe(
      (response) => {
        this.brands = response;
        this.checkBrand();
      },
      (error) => {
        console.error(error);
      }
    );
  }

  checkBrand() {
    if (this.data && this.brands) {
      const brandFound = this.brands.some((brand: any) => brand.codigo === this.data.vehiculo_marca);
      if (!brandFound) {
        this.brands.push({
          codigo: this.data.vehiculo_marca,
          nombre: "Marca no encontrada"
        });
      }
    }
  }

  getModalities() {
    this.apiService.getData('modalities').subscribe(
      (response) => {
        this.modalities = response;
        this.checkModality();
      },
      (error) => {
        console.error(error);
      }
    );
  }

  checkModality() {
    if (this.data && this.modalities) {
      const modalityFound = this.modalities.some((modality: any) => modality.codigo === this.data.vehiculo_modalidad);
      if (!modalityFound && this.data.vehiculo_modalidad !== '') {
        this.modalities.push({
          codigo: this.data.vehiculo_modalidad,
          nombre: "Modalidad no encontrada"
        });
      }
    }
  }

  // TODO: Arreglar llamado al endpoint por nuevo
  getOwners() {
    this.apiService.getData('owners').subscribe(
      (response) => {
        this.owners = response;
        this.checkOwner();
      },
      (error) => {
        console.error(error);
      }
    );
  }

  checkOwner() {
    if (this.data && this.owners) {
      const ownerFound = this.owners.some((owner: any) => owner.id === this.data.vehiculo_propietario);
      if (!ownerFound) {
        this.owners.push({
          id: this.data.vehiculo_propietario,
          name: "Propietario no encontrado"
        });
      }
    }
  }

  getCentral() {
    this.apiService.getData('central').subscribe(
      (response) => {
        this.central = response;
        this.checkCentral();
      },
      (error) => {
        console.error(error);
      }
    );
  }

  checkCentral() {
    if (this.data && this.central) {
      const centralFound = this.central.some((central: any) => central.codigo === this.data.vehiculo_central);
      if (!centralFound) {
        this.central.push({
          codigo: this.data.vehiculo_propietario,
          nombre: "Propietario no encontrado"
        });
      }
    }
  }

  getExpenseAccounts() {
    this.apiService.getData('expense-accounts').subscribe(
      (response) => {
        this.expenseAccounts = response;
        // this.checkExpenseAccount();
      },
      (error) => {
        console.error(error);
      }
    );
  }

  // checkExpenseAccount() {
  //   if (this.data && this.expenseAccounts) {
  //     const expenseAccountFound = this.expenseAccounts.some((expenseAccount: any) => expenseAccount.codigo === this.data.vehiculo_cta_gasto);
  //     if (!expenseAccountFound) {
  //       this.expenseAccounts.push({
  //         codigo: this.data.vehiculo_cuenta_gasto,
  //         nombre: "Cuenta de gasto no encontrada"
  //       });
  //     }
  //   }
  // }

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

    this.data.vehiculo_licencia_fec = this.finalDate(this.data.vehiculo_licencia_fec);
    this.data.vehiculo_fec_importacion = this.finalDate(this.data.vehiculo_fec_importacion);
    this.data.vehiculo_fec_vencimiento_matricula = this.finalDate(this.data.vehiculo_fec_vencimiento_matricula);
    this.data.vehiculo_fec_matricula = this.finalDate(this.data.vehiculo_fec_matricula);
  
    this.apiService.updateData(`vehicle/${this.code}`, this.data).subscribe(
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

  getVehicles() {
    this.apiService.getData('vehicle-codes').subscribe(
      (response) => {
        this.vehicles = response
          .filter((vehicles: any) => vehicles.vehiculo_numero)  // Filtramos los drivers con número
          .sort((a: any, b: any) => a.vehiculo_consecutivo - b.vehiculo_consecutivo);  // Ordenamos los drivers por consecutivo
      },
      (error) => {
        console.error(error);
      }
    );
  }
  

  nextVehicle() {
    const currentIndex = this.vehicles.findIndex((vehicle: any) => vehicle.vehiculo_consecutivo === this.data.vehiculo_consecutivo);
    if (currentIndex !== -1 && currentIndex < this.vehicles.length - 1) {
      const nextVehicleId = this.vehicles[currentIndex + 1].vehiculo_consecutivo
      this.router.navigate(['/vehicle/' + nextVehicleId]).then(() => {
        window.location.reload();
      });
    }

    if(currentIndex === this.vehicles.length - 1){
      this.firstVehicle()
    }
  }
  
  backVehicle() {
    const currentIndex = this.vehicles.findIndex((vehicle: any) => vehicle.vehiculo_consecutivo === this.data.vehiculo_consecutivo);
    if (currentIndex !== -1 && currentIndex > 0) {
      const previousVehicleId = this.vehicles[currentIndex - 1].vehiculo_consecutivo;
      this.router.navigate(['/vehicle/' + previousVehicleId]).then(() => {
        window.location.reload();
      });
    }

    if (currentIndex === 0) {
      this.lastVehicle()
    }
  }
  

  firstVehicle() {
    this.router.navigate(['/vehicle/' + this.vehicles[0].vehiculo_consecutivo]).then(() => {
      window.location.reload();
    });
  }
  
  lastVehicle() {
    this.router.navigate(['/vehicle/' + this.vehicles[this.vehicles.length - 1].vehiculo_consecutivo]).then(() => {
      window.location.reload();
    });
  }

  goToVehicleOwnership() {
    this.selectButton('propiedad')
    this.VehiclesDocumentation = false;
  }

  goToVehicleDocuments() {
    this.selectButton('documentos')
    this.VehiclesDocumentation = false;
  }

  goToVehicleDrivers() {
    this.selectButton('conductores')
    this.VehiclesDocumentation = false;
  }

  goToVehicleIncome() {
    this.selectButton('ingresos')
    this.VehiclesDocumentation = false;
  }

  goToVehicleOrders() {
    this.selectButton('ordenes')
    this.VehiclesDocumentation = false;
  }

  goToVehicleTools() {
    this.selectButton('herramientas')
    this.VehiclesDocumentation = false;
  }

  goToVehiclePhotos() {
    this.selectButton('fotos')
    this.VehiclesDocumentation = false;
  }

  goToVehicleDocumentation() {
    this.selectButton('documentacion')
    this.VehiclesDocumentation = true;
  }

  goToVehiclePyG() {
    this.selectButton('pyg')
    this.VehiclesDocumentation = false;
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
