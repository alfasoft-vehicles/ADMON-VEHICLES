import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from 'src/app/services/api.service';
import { JwtService } from 'src/app/services/jwt.service';

interface Owner {
  id: string;
  name: string;
}

@Component({
  selector: 'app-owners-statusfleetsummary',
  templateUrl: './owners-statusfleetsummary.component.html',
  styleUrls: ['./owners-statusfleetsummary.component.css'],
})
export class OwnersStatusfleetsummaryComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  isLoading: boolean = true;

  owners: Owner[] = [];

  user: any;

  infoForm: FormGroup;

  constructor(
    private apiService: ApiService,
    private jwtService: JwtService,
    private fb: FormBuilder
  ) {
    this.infoForm = this.fb.group({
      companie: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.listOwners();
    this.getUser();
  }

  getCompany() {
    const userData = this.jwtService.getUserData();
    return userData ? userData.empresa : '';
  }

  listOwners(): void {
    const userData = this.jwtService.getUserData();
    const owner = {
      propietario: userData ? userData.id : null,
    };

    this.apiService.postData('companies_owners', owner).subscribe(
      (response) => {
        this.owners = response.filter((owner: any) => owner.id);
        this.owners.sort((a, b) => a.name.localeCompare(b.name));
        this.isLoading = false;
      },
      (error) => {
        console.error(error);
      }
    );
  }

  getUser() {
    this.user = this.jwtService.getUserData();
    this.user = this.user.nombre;
  }

  resetValues(): void {
    this.infoForm.reset();
  }

  onSubmit(): void {
    if (this.infoForm.valid) {
      this.openExternalLink();
    }
  }

  openExternalLink(): void {
    const company = this.getCompany();

    let endpoint = 'estado-vehiculos-resumen-empresa/';
    endpoint += this.infoForm.value.companie;
    endpoint += `/${company}`;
    if (endpoint) {
      const data = { user: this.user };
      localStorage.setItem('pdfEndpoint', endpoint);
      localStorage.setItem('pdfData', JSON.stringify(data));
      window.open(`/pdf`, '_blank');
      this.resetValues();
      this.closeModal();
    } else {
      console.error('URL no encontrada para la opción seleccionada.');
    }
  }

  closeModal() {
    this.close.emit();
  }
}
