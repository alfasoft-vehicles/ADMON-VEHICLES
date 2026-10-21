import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from 'src/app/services/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-owners-addnew',
  templateUrl: './owners-addnew.component.html',
  styleUrls: ['./owners-addnew.component.css']
})
export class OwnersAddnewComponent implements OnInit {
  selectedButton: string = "hoja";
  OwnersContractView = false;
  ownerForm: FormGroup;
  cities: any = null;
  users: any = null;
  central: any = null;
  owners: any = null;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router
  ) {
    this.ownerForm = this.fb.group({
      codigo: ['', [Validators.required, Validators.pattern(/^\d{1,12}$/)]],
      nombre_propietario: ['', [Validators.required, Validators.maxLength(50)]],
      nombre_abreviado: ['', Validators.maxLength(20)],
      nit: ['', [Validators.pattern(/^\d{1,10}$/)]], 
      ruc: ['', Validators.maxLength(18)],
      ciudad: ['', Validators.maxLength(5)],
      direccion: ['', Validators.maxLength(60)],
      telefono: ['', Validators.maxLength(30)],
      celular: ['', Validators.maxLength(30)],
      celular1: ['', Validators.maxLength(30)],
      representante: ['', Validators.maxLength(40)],
      contacto: ['', Validators.maxLength(40)],
      correo: ['', Validators.maxLength(12)],
      correo1: ['', Validators.maxLength(20)],
      estado: [''], 
      auditor: [''],
      central: [''],
      grupo: ['', Validators.maxLength(10)],
      impuesto: [0, Validators.pattern(/^\d{1,2}$/)], 
      admon_parado: [0, Validators.pattern(/^\d{1,3}$/)], 
      descuento: [0, Validators.pattern(/^\d{1,5}$/)], 
      fec_nacimiento: [''],
      fec_ingreso: [''],
      razon_social: ['', Validators.maxLength(50)],
      tipo_documento: ['', Validators.maxLength(12)],
      numero_documento: ['', Validators.maxLength(20)],
      sexo: ['', Validators.maxLength(10)],
      estado_civil: ['', Validators.maxLength(20)],
      nacionalidad: ['', Validators.maxLength(10)],
      ficha: ['', Validators.maxLength(40)],
      documento: ['', Validators.maxLength(40)]
    });
  }

  ngOnInit(): void {
    this.getCities();
    this.getUsers();
    this.getCentral();
    this.getOwners()
  }

  getCities() {
    this.apiService.getData('cities').subscribe(
      (response) => {
        this.cities = response;
      },
      (error) => {
        console.error(error);
      }
    );
  }

  getUsers() {
    this.apiService.getData('users').subscribe(
      (response) => {
        this.users = response.filter((users: any) => users.codigo);
      },
      (error) => {
        console.error(error);
      }
    );
  }

  getCentral() {
    this.apiService.getData('central').subscribe(
      (response) => {
        this.central = response.filter((central: any) => central.codigo);
      },
      (error) => {
        console.error(error);
      }
    );
  }

  getOwners() {
    this.apiService.getData('owner-codes').subscribe(
      (response) => {
        this.owners = response.filter((owners: any) => owners);
      },
      (error) => {
        console.error(error);
      }
    );
  }

  selectButton(button: string) {
    this.selectedButton = button;
  }

  goToOwnerResume() {
    this.selectButton('hoja')
    this.OwnersContractView = false;
  }

  goToOwnerContract() {
    this.selectButton('contrato')
    this.OwnersContractView = true;
  }

  checkCode(): boolean {
    const code = this.ownerForm.get('codigo')?.value;
    if (code !== null && code !== undefined && code !== '') {
      const owner = this.owners.find((owner: any) => owner === code.toString());
      if (owner) {
        window.alert('El código ya existe.');
        this.ownerForm.get('codigo')?.setValue('');
        return false;
      }
      return true;
    }
    return false;
  }

  onSubmit() {
    if (this.ownerForm.valid) {
      if (this.checkCode()){
        const formData = this.ownerForm.value;
        this.apiService.postData('owners', formData).subscribe(
          (response) => {
            window.alert('Propietario creado exitosamente.');
            this.ownerForm.reset();
            this.router.navigate(['/owners']);
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
