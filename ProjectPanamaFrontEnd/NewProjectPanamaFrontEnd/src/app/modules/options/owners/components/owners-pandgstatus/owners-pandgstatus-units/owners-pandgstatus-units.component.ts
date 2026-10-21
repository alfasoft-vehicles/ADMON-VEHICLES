import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from 'src/app/services/api.service';
import { JwtService } from 'src/app/services/jwt.service';

interface Owner {
  id: string;
  name: string;
}

interface DateCurrently {
  time: string;
}

@Component({
  selector: 'app-owners-pandgstatus-units',
  templateUrl: './owners-pandgstatus-units.component.html',
  styleUrls: ['./owners-pandgstatus-units.component.css'],
})
export class OwnersPandgstatusUnitsComponent  implements OnInit {
  @Output() close = new EventEmitter<void>();

  isLoadingValues: boolean = true;

  owners: Owner[] = [];

  selectedOwners: string[] = [];

  user: any;

  infoForm: FormGroup;

  date!: DateCurrently;

  constructor(
    private apiService: ApiService,
    private jwtService: JwtService,
    private fb: FormBuilder
  ) {
    this.infoForm = this.fb.group({
      firstDate: ['', Validators.required],
      lastDate: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.getDate();
    this.getOwners();
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
      },
      (error) => {
        error.log(error);
      }
    );
  }

  getOwners(): void {
    const userData = this.jwtService.getUserData();
    const owner = {
      propietario: userData ? userData.id : null,
    };

    this.apiService.postData('companies_owners', owner).subscribe(
      (response) => {
        this.owners = response.filter((owner: any) => owner.id);
        this.owners.sort((a, b) => a.name.localeCompare(b.name));
        this.isLoadingValues = false;
      },
      (error) => {
        error.log(error);
      }
    );
  }

  getUser() {
    this.user = this.jwtService.getUserData();
    this.user = this.user.nombre;
  }

  isEmpresaSeleccionada(opcionId: string): boolean {
    return this.selectedOwners.includes(opcionId);
  }

  onCheckboxEmpresaChange(opcionId: string, event: any) {
    if (event.target.checked) {
      if (!this.selectedOwners.includes(opcionId)) {
        this.selectedOwners.push(opcionId);
      }
    } else {
      this.selectedOwners = this.selectedOwners.filter(
        (id) => id !== opcionId
      );
    }
  }

  onCheckboxEmpresaContainerClick(opcionId: string, event: any) {
    const checkbox = event.currentTarget.querySelector(
      'input[type="checkbox"]'
    );
    checkbox.checked = !checkbox.checked;
    this.onCheckboxEmpresaChange(opcionId, { target: checkbox });
    event.stopPropagation();
  }

  getOwnersId(): string[] {
    return this.owners.map((owner) => owner.id).filter((id) => id);
  }

  onSubmit(): void {
    if (this.infoForm && this.infoForm.valid) {
      
      if(this.selectedOwners.length === 0) {
        this.selectedOwners = this.getOwnersId();
      }

      this.openExternalLink();
    }
  }

  openExternalLink(): void {
    const company = this.getCompany();
    let endpoint = 'pandgstatus/'+company;
    if (endpoint) {

      const data = {
        usuario: this.user,
        primeraFecha: this.infoForm.value.firstDate,
        ultimaFecha: this.infoForm.value.lastDate,
        empresa: this.selectedOwners, 
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
