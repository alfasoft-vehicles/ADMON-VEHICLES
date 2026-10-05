import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from 'src/app/services/api.service';
import { JwtService } from 'src/app/services/jwt.service';

interface Vehicle {
  placa: string;
  numero: string;
  marca: string;
  consecutivo: string;
}

interface DateCurrently {
  time: string;
}

interface CompaniesOwners {
  id: string;
  name: string;
}

@Component({
  selector: 'app-owners-relationshiprevenues',
  templateUrl: './owners-relationshiprevenues.component.html',
  styleUrls: ['./owners-relationshiprevenues.component.css'],
})
export class OwnersRelationshiprevenuesComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  isLoading: boolean = false;
  isLoadingValues: boolean = true;

  vehicles: Vehicle[] = [];

  vehicles_per: any;
  companiesKeys: string[] = [];
  selectedCompany: string = '';

  user: any;

  infoForm: FormGroup;

  companiesOwners: CompaniesOwners[] = [];

  date!: DateCurrently;

  constructor(
    private apiService: ApiService,
    private jwtService: JwtService,
    private fb: FormBuilder,
  ) {
    this.infoForm = this.fb.group({
      companie: ['', Validators.required],
      vehicle: [{ value: '', disabled: true }],
      firstDate: ['', Validators.required],
      lastDate: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.listVehiclesPerOwners();
    this.listVehicles();
    this.getDate();
    this.getUser();
  }

  getCompany() {
    const userData = this.jwtService.getUserData();
    return userData ? userData.empresa : '';
  }

  getDate(): void {
    this.apiService.getData('extras/time').subscribe(
      (response) => {
        this.date = response;
        this.isLoadingValues = false;
      },
      (error) => {
        error.log(error);
      },
    );
  }

  onCompanyChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const value = selectElement.value;
    this.selectedCompany = value;
    if (value) {
      this.infoForm.get('vehicle')?.enable();
    } else {
      this.infoForm.get('vehicle')?.disable();
    }
  }

  listVehiclesPerOwners(): void {
    const userData = this.jwtService.getUserData();
    const vehicle = {
      propietario: userData ? userData.id : null,
    };

    this.apiService.postData('vehicles_per_owners', vehicle).subscribe(
      (response) => {
        this.vehicles_per = response; // vehicles ahora es un objeto
        // Extraer las llaves (nombres de empresa)
        this.companiesKeys = Object.keys(response);
      },
      (error) => {
        error.log(error);
      },
    );
  }

  listVehicles(): void {
    const userData = this.jwtService.getUserData();
    const vehicle = {
      propietario: userData ? userData.id : null,
    };

    this.apiService.postData('vehicles_owners', vehicle).subscribe(
      (response) => {
        this.vehicles = response;
        // this.vehicles.sort((a, b) => a.numero.localeCompare(b.numero));
        const defaultVehicle = {
          placa: '',
          numero: '',
          marca: '',
          consecutivo: '',
        };
        this.vehicles = [defaultVehicle, ...this.vehicles];
      },
      (error) => {
        error.log(error);
      },
    );
  }

  getUser() {
    this.user = this.jwtService.getUserData();
    this.user = this.user.nombre;
    this.getCompanies();
  }

  getCompanies() {
    const userData = this.jwtService.getUserData();
    const owner = {
      propietario: userData ? userData.id : null,
    };
    this.apiService.postData('companies_owners', owner).subscribe(
      (response: any[]) => {
        this.companiesOwners = response.map((item) => item.id);
      },
      (error) => {
        console.error(error);
      },
    );
  }

  onSubmit(): void {
    if (this.infoForm.valid) {
      this.openExternalLink();
    }
  }

  openExternalLink(): void {
    const company = this.getCompany();
    let endpoint = 'relationshiprevenues/' + company;
    if (endpoint) {
      const companyValue = this.infoForm.value.companie;
      const companyId = companyValue.split(' - ').pop()?.trim() || companyValue;

      const data = {
        usuario: this.user,
        primeraFecha: this.infoForm.value.firstDate,
        ultimaFecha: this.infoForm.value.lastDate,
        unidad: this.infoForm.value.vehicle,
        empresa: companyId,
      };
      localStorage.setItem('pdfEndpoint', endpoint);
      localStorage.setItem('pdfData', JSON.stringify(data));
      window.open(`/pdf`, '_blank');
      this.closeModal();
    } else {
      console.error('URL no encontrada para la opción seleccionada.');
    }
  }

  closeModal() {
    this.close.emit();
  }
}
