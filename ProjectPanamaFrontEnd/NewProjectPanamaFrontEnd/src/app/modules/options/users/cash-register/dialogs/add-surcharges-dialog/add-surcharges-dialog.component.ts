import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApiService } from 'src/app/services/api.service';
import { JwtService } from 'src/app/services/jwt.service';

export interface SurchargeType {
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
  surchargesList: SurchargeType[] = [];
  selectedSurchargeCode: string = '';
  surchargeValue: number | null = null;

  constructor(
    public dialogRef: MatDialogRef<AddSurchargesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private apiService: ApiService,
    private jwtService: JwtService
  ) {}

  ngOnInit(): void {
    this.fetchSurcharges();
  }

  fetchSurcharges(): void {
    this.isLoading = true;
    const userData = this.jwtService.getUserData();
    const company = userData ? userData.empresa : '';

    this.apiService.getData(`surcharges/${company}`).subscribe({
      next: (res: SurchargeType[]) => {
        this.surchargesList = res || [];
        if (this.surchargesList.length > 0) {
          this.selectedSurchargeCode = this.surchargesList[0].code;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al obtener tipos de recargos:', err);
        this.isLoading = false;
      },
    });
  }

  loadSurcharge(): void {
    if (this.surchargeValue && this.surchargeValue > 0 && this.selectedSurchargeCode) {
      const selectedItem = this.surchargesList.find(
        (item) => item.code === this.selectedSurchargeCode
      );
      this.dialogRef.close({
        value: Number(this.surchargeValue),
        code: this.selectedSurchargeCode,
        name: selectedItem ? selectedItem.name : '',
      });
    }
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
