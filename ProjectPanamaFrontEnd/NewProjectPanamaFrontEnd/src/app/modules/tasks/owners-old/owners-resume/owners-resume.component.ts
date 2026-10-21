import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-owners-resume',
  templateUrl: './owners-resume.component.html',
  styleUrls: ['./owners-resume.component.css']
})
export class OwnersResumeComponent implements OnInit {
  selectedButton: string = "hoja";
  code: string | null = null;
  data: any = null;
  dataOriginal: any = null;
  cities: any = null;
  central: any = null;
  users: any = null;
  vehicles: any = null;
  owners: any = '';
  isLoading = true;
  isEditable = false;
  cityFound = false;
  centralFound = false;
  usersFound = false;
  stateEdited = false;
  OwnersVehiclesView = false;
  OwnersContractView = false;
  isModalVisible: boolean = false;

  constructor(
    private route: ActivatedRoute, 
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.code = params.get('code');
    });
    this.fetchData();
    this.delay(500);
    this.getUsers();
    this.getCities();
    this.getCentral();
    this.getVehicles();
    this.getOwners();
  }

  async delay(ms: number) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  fetchData() {
    this.apiService.getData(`owner/${this.code}`).subscribe(
      (response) => {
        this.data = response;
        this.dataOriginal = { ...this.data };
        this.stateEdited = false;
        this.checkDate();
        this.checkCity();
      },
      (error) => {
        console.error(error);
        
      }
    );
  }

  checkDate() {
    this.data.fec_nacimiento = this.validateDate(this.data.fec_nacimiento);
    this.data.fec_ingreso = this.validateDate(this.data.fec_ingreso);
  }

  validateDate(date: string): string {
    return date === "0000-00-00" ? "" : date;
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

  getCentral() {
    this.apiService.getData('central').subscribe(
      (response) => {
        this.central = response.filter((central: any) => central.codigo);
        this.checkCentral();
        this.isLoading = false;
      },
      (error) => {
        console.error(error);
        this.isLoading = false;
      }
    );
  }

  checkCentral() {
    if (this.data && this.central) {
      this.centralFound = this.central.some((central: any) => central.codigo === this.data.central);
      if (!this.centralFound) {
        this.central.push({
          codigo: this.data.central,
          nombre: "Central no encontrada"
        });
      }
    }
  }

  getUsers() {
    this.apiService.getData('users').subscribe(
      (response) => {
        this.users = response.filter((users: any) => users.codigo);
        this.checkUsers();
      },
      (error) => {
        console.error(error);
      }
    );
  }

  checkUsers() {
    var varCodigo;
    var varNombre  = "Sin Auditor";
    if(this.data.auditor == null) {
      this.data.auditor = '';
      varCodigo = this.data.auditor;
    }
    else {
      varCodigo = '';
    }
    if (this.data && this.users) {
      this.usersFound = this.users.some((users: any) => users.codigo === this.data.auditor);
      if (!this.usersFound) {
        varCodigo = this.data.auditor;
        if(varCodigo !== '') {
          varNombre = "Auditor no encontrado";
        }
      }
      this.users.push({
        codigo: varCodigo,
        nombre: varNombre
      });
    }
  }

  getVehicles() {
    this.apiService.getData(`owner-vehicles/${this.code}`).subscribe(
      (response) => {
        this.vehicles = response;
        this.vehicles.sort((a: any, b: any) => {
          const aStartsWithSpecialChar = a.estado.startsWith('»');
          const bStartsWithSpecialChar = b.estado.startsWith('»');

          if (aStartsWithSpecialChar && !bStartsWithSpecialChar) {
            return 1;
          }
          if (!aStartsWithSpecialChar && bStartsWithSpecialChar) {
            return -1;
          }

          return a.estado.localeCompare(b.estado);
          }
        );
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
        this.owners = response.filter((owners: any) => owners.id);
      },
      (error) => {
        console.error(error);
      }
    );
  }

  nextOwner() {
    const currentIndex = this.owners.findIndex((owner: any) => owner.id === this.code);
    if (currentIndex !== -1 && currentIndex < this.owners.length - 1) {
      const nextOwnerId = this.owners[currentIndex + 1].id;
      this.router.navigate(['/owner/' + nextOwnerId]).then(() => {
        window.location.reload();
      });
    }

    if(currentIndex === this.owners.length - 1){
      this.firstOwner()
    }
  }
  
  backOwner() {
    const currentIndex = this.owners.findIndex((owner: any) => owner.id === this.code);
    if (currentIndex !== -1 && currentIndex > 0) {
      const previousOwnerId = this.owners[currentIndex - 1].id;
      this.router.navigate(['/owner/' + previousOwnerId]).then(() => {
        window.location.reload();
      });
    }

    if (currentIndex === 0) {
      this.lastOwner()
    }
  }
  

  firstOwner() {
    this.router.navigate(['/owner/' + this.owners[0].id]).then(() => {
      window.location.reload();
    });
  }
  
  lastOwner() {
    this.router.navigate(['/owner/' + this.owners[this.owners.length - 1].id]).then(() => {
      window.location.reload();
    });
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

  newData() {
    const fields = [
      'nombre', 'abreviado', 'cc', 'ruc', 'ciudad', 'direccion', 
      'telefono', 'celular', 'celular1', 'representante', 'contacto', 
      'correo', 'correo1', 'estado', 'auditor', 'central', 'grupo', 
      'impuesto', 'admon_parado', 'descuento', 'fec_nacimiento', 'fec_ingreso', 'razon_social', 'tipo_documento', 'numero_documento', 'sexo', 'estado_civil', 'nacionalidad', 'ficha', 'documento'
    ]
    const dataToSave: any = {};
    fields.forEach(field => {
      const element = document.getElementById(field) as HTMLInputElement;
      if (element) {
        dataToSave[field] = element.value;
      }
    });
    
    // Add the 'codigo' field which should be read-only
    const codigoElement = document.getElementById('codigo') as HTMLInputElement;
    if (codigoElement) {
      dataToSave['codigo'] = codigoElement.value;
    }

    return dataToSave;
  }

  checkModifiedData(): boolean {
    for (const key in this.data) {
      if(key == 'fec_nacimiento' || key == 'fec_ingreso') {
        if(this.data[key] == '') {
          this.data[key] = '0000-00-00';
        }
      }
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
  
    this.apiService.updateData(`owner/${this.code}`, this.data).subscribe(
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

  goToOwnerResume() {
    this.selectButton('hoja')
    this.OwnersContractView = false;
    this.OwnersVehiclesView = false;
  }

  goToOwnerContract() {
    this.selectButton('contrato')
    this.OwnersVehiclesView = false
    this.OwnersContractView = true;
  }

  goToOwnerVehicles() {
    this.selectButton('vehiculos')
    this.OwnersContractView = false;
    this.OwnersVehiclesView = true;
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
