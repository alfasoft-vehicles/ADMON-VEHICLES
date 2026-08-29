import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from 'src/app/services/api.service';
import { JwtService } from 'src/app/services/jwt.service';

export interface SurchargeType {
  code: string;
  name: string;
}

export interface AddSurchargesDialogData {
  companyCode?: string;
  vehicleNumber?: string;
  driverNumber?: string;
}

export interface AddSurchargeResult {
  value: number;
  code: string;
  name: string;
}

@Component({
  selector: 'app-add-surcharges-dialog',
  templateUrl: './add-surcharges-dialog.component.html',
  styleUrls: ['./add-surcharges-dialog.component.css'],
})
export class AddSurchargesDialogComponent implements OnInit {
  isLoading: boolean = true;
  isSubmitting: boolean = false;
  surchargesList: SurchargeType[] = [];
  selectedSurchargeCode: string = '';
  surchargeValue: number | null = null;

  constructor(
    public dialogRef: MatDialogRef<AddSurchargesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddSurchargesDialogData,
    private apiService: ApiService,
    private jwtService: JwtService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.fetchSurcharges();
  }

  fetchSurcharges(): void {
    this.isLoading = true;
    const userData = this.jwtService.getUserData();
    const company =
      this.data?.companyCode || (userData ? userData.empresa : '');

    this.apiService.getData(`surcharges/${company}`).subscribe({
      next: (res: SurchargeType[]) => {
        if (res && res.length > 0) {
          this.surchargesList = res;
        } else {
          this.surchargesList = this.getFallbackSurcharges();
        }
        if (this.surchargesList.length > 0) {
          this.selectedSurchargeCode = this.surchargesList[0].code;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al obtener tipos de recargos:', err);
        this.surchargesList = this.getFallbackSurcharges();
        if (this.surchargesList.length > 0) {
          this.selectedSurchargeCode = this.surchargesList[0].code;
        }
        this.isLoading = false;
      },
    });
  }

  private getFallbackSurcharges(): SurchargeType[] {
    return [
      { code: '121', name: 'Acuerdos De Pago' },
      { code: '122', name: 'Exceso de Kilometraje' },
      { code: '123', name: 'Gastos Administrativos' },
      { code: '124', name: 'Mantenimiento' },
      { code: '125', name: 'Multa Por Pagar Tarde' },
      { code: '126', name: 'Negativo Panapass' },
      { code: '127', name: 'Otras (Salida Interior-Cierre Semana)' },
      { code: '128', name: 'Recargos Financieros' },
    ];
  }

  loadSurcharge(): void {
    if (
      !this.surchargeValue ||
      this.surchargeValue <= 0 ||
      !this.selectedSurchargeCode ||
      this.isSubmitting
    ) {
      return;
    }

    const userData = this.jwtService.getUserData();
    const companyCode =
      this.data?.companyCode || (userData ? userData.empresa : '');
    const vehicleNumber = this.data?.vehicleNumber || '';
    const driverNumber = this.data?.driverNumber || '';
    const userId = userData?.id ? String(userData.id) : '';

    if (!vehicleNumber || !driverNumber) {
      this.snackBar.open(
        'Debe seleccionar un vehículo y un conductor válidos antes de añadir un recargo.',
        'Cerrar',
        { duration: 4000, verticalPosition: 'top' },
      );
      return;
    }

    const selectedItem = this.surchargesList.find(
      (item) => item.code === this.selectedSurchargeCode,
    );

    const payload = {
      company_code: String(companyCode),
      vehicle_number: String(vehicleNumber),
      driver_number: String(driverNumber),
      user: userId,
      surcharges_list: [
        {
          id: String(this.selectedSurchargeCode),
          value: String(this.surchargeValue),
        },
      ],
    };

    this.isSubmitting = true;

    this.apiService.postData('wallet/create-surcharge', payload).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.dialogRef.close({
          value: Number(this.surchargeValue),
          code: this.selectedSurchargeCode,
          name: selectedItem ? selectedItem.name : '',
        });
      },
      error: (err) => {
        console.error('Error al crear recargo:', err);
        this.isSubmitting = false;
        const msg =
          err?.error?.message ||
          'Error al crear el recargo. Intente nuevamente.';
        this.snackBar.open(msg, 'Cerrar', {
          duration: 4000,
          verticalPosition: 'top',
        });
      },
    });
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
