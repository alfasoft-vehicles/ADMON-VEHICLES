import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map, Observable, startWith } from 'rxjs';
import { SignaturePadComponent } from 'src/app/modules/shared/components/signature-pad/signature-pad.component';
import { ApiService } from 'src/app/services/api.service';
import { JwtService } from 'src/app/services/jwt.service';

interface vehicle {
  unidad: string;
  placa: string;
  propietario: string;
  nro_cupo: string;
}

interface contractInfo {
  numero: string;
  marca: string;
  placa: string;
  cupo: string;
  central: string;
  propietario_nombre: string;
  nro_entrega: string;
  cuota_diaria: number;
  valor_deposito: number;
  estado: string;
  con_cupo: string;
  conductor_codigo: string;
  conductor_nombre: string;
  conductor_cedula: string;
  conductor_celular: string;
  conductor_direccion: string;
  fecha_contrato: string;
  permitido: number | null | undefined;
  mensaje: string;
  advertencia: [];
  firma_conductor: number;
  foto_conductor: number;
}

@Component({
  selector: 'app-operaciones-contrato-declaracion-jurada',
  templateUrl: './operaciones-contrato-declaracion-jurada.component.html',
  styleUrls: ['./operaciones-contrato-declaracion-jurada.component.css'],
})
export class OperacionesContratoDeclaracionJuradaComponent implements OnInit {
  @ViewChild(SignaturePadComponent)
  signaturePadComponent!: SignaturePadComponent;

  vehicles = new FormControl('');
  drivers = new FormControl({ value: '', disabled: true });
  selectedDate = new FormControl<Date | null>(
    { value: null, disabled: true },
    { validators: [Validators.required] },
  );
  options: vehicle[] = [];
  filteredOptions!: Observable<vehicle[]>;
  maxDate = new Date();

  isLoadingVehicles = true;
  isLoadingContractInfo = false;
  signatureDriver = false;

  contractInfo: contractInfo = {
    numero: '',
    marca: '',
    placa: '',
    cupo: '',
    central: '',
    propietario_nombre: '',
    nro_entrega: '',
    cuota_diaria: 0,
    valor_deposito: 0,
    estado: '',
    con_cupo: '',
    conductor_codigo: '',
    conductor_nombre: '',
    conductor_cedula: '',
    conductor_celular: '',
    conductor_direccion: '',
    fecha_contrato: '',
    permitido: null,
    mensaje: '',
    advertencia: [],
    firma_conductor: 0,
    foto_conductor: 0,
  };

  constructor(
    private apiService: ApiService,
    private jwtService: JwtService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<OperacionesContratoDeclaracionJuradaComponent>,
  ) {}

  ngOnInit() {
    this.getVehicles();
    this.getMaxDate();
  }

  getMaxDate() {
    this.apiService.getData('extras/time').subscribe(
      (response: any) => {
        const dateParts = response.time.split('-');
        this.maxDate = new Date(
          parseInt(dateParts[0]),
          parseInt(dateParts[1]) - 1,
          parseInt(dateParts[2]),
        );
      },
      (error) => {
        this.maxDate = new Date();
      },
    );
  }

  getCompany() {
    const userData = this.jwtService.getUserData();
    return userData ? userData.empresa : '';
  }

  getVehicles() {
    const company = this.getCompany();
    this.apiService.getData('vehicles/' + company).subscribe(
      (response: vehicle[]) => {
        this.options = response;
        this.filteredOptions = this.vehicles.valueChanges.pipe(
          startWith(''),
          map((value) => this._filter(value || '')),
        );
        this.isLoadingVehicles = false;
      },
      (error) => {
        console.error('Error fetching vehicles:', error);
        this.openSnackbar(
          'Error al obtener las unidades. Inténtalo de nuevo más tarde.',
        );
        this.closeDialog();
      },
    );
  }

  openSnackbar(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3500,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  resetInfo() {
    this.contractInfo = {
      numero: '',
      marca: '',
      placa: '',
      cupo: '',
      central: '',
      propietario_nombre: '',
      nro_entrega: '',
      cuota_diaria: 0,
      valor_deposito: 0,
      estado: '',
      con_cupo: '',
      conductor_codigo: '',
      conductor_nombre: '',
      conductor_cedula: '',
      conductor_celular: '',
      conductor_direccion: '',
      fecha_contrato: '',
      permitido: null,
      mensaje: '',
      advertencia: [],
      firma_conductor: 0,
      foto_conductor: 0,
    };
    this.drivers.setValue('');
    this.selectedDate.setValue(this.maxDate);
    this.selectedDate.markAsUntouched();
    this.selectedDate.markAsPristine();
  }

  resetVehicleAutocomplete() {
    // Resetear el autocomplete completamente
    this.vehicles.setValue('');
    this.vehicles.updateValueAndValidity();

    // Opcional: Forzar la actualización del filtro
    this.filteredOptions = this.vehicles.valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(value || '')),
    );
  }

  getContractInfo(event: any) {
    if (event.option.value === undefined) {
      this.resetInfo();
      this.resetVehicleAutocomplete();
      return;
    }

    if (event && event.option.value !== undefined) {
      const selectedVehicle = event.option.value;
      this.isLoadingContractInfo = true;
      this.resetInfo();

      this.apiService
        .getData('operations/generate-contract/info/' + selectedVehicle)
        .subscribe(
          (response: contractInfo) => {
            this.isLoadingContractInfo = false;
            this.contractInfo = response;
            this.drivers.setValue(response.conductor_codigo);

            const dateParts = response.fecha_contrato.split('/');
            const day = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]) - 1;
            const year = parseInt(dateParts[2]);
            this.selectedDate.setValue(new Date(year, month, day));
          },
          (error) => {
            console.error('Error fetching contract info:', error);
            this.openSnackbar(
              'Error al obtener la información. Inténtalo de nuevo con otra unidad.',
            );
            this.isLoadingContractInfo = false;
            this.resetInfo();
            this.resetVehicleAutocomplete();
          },
        );
    }
  }

  private _filter(value: string): vehicle[] {
    const filterValue = value.toLowerCase();

    return this.options.filter(
      (option) =>
        option.placa.toLowerCase().includes(filterValue) ||
        option.unidad.toLowerCase().includes(filterValue) ||
        option.propietario.toLowerCase().includes(filterValue) ||
        option.nro_cupo.toLowerCase().includes(filterValue),
    );
  }

  saveSignature() {
    if (this.signaturePadComponent) {
      this.signaturePadComponent.saveSignature();
    }
  }

  openExternalLink(signatureBase64: string) {
    const endpoint = 'operations/generate-contract/pdf/' + this.vehicles.value;

    const data = {
      company_code: this.getCompany(),
      signature_base64: signatureBase64,
    };

    localStorage.setItem('pdfEndpoint', endpoint);
    localStorage.setItem('pdfData', JSON.stringify(data));
    window.open(`/pdf`, '_blank');
    this.closeDialog();
  }

  generateContract() {
    if (this.vehicles.value === '') {
      this.openSnackbar('Debes seleccionar una unidad.');
      return;
    }

    // Validar que el formulario sea válido
    if (this.drivers.value === '' || this.selectedDate.value === null) {
      this.openSnackbar('Debes completar todos los campos obligatorios.');
      this.selectedDate.markAsTouched();
      return;
    }

    this.signatureDriver = true;
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
