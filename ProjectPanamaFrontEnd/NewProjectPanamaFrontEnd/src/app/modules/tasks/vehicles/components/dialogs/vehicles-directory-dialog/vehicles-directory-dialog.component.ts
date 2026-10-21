import {
  animate,
  query,
  stagger,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSelectionList } from '@angular/material/list';
import { ApiService } from 'src/app/services/api.service';
import { JwtService } from 'src/app/services/jwt.service';

interface States {
  id: string;
  name: string;
}

@Component({
  selector: 'app-vehicles-directory-dialog',
  templateUrl: './vehicles-directory-dialog.component.html',
  styleUrls: ['./vehicles-directory-dialog.component.css'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate(
          '300ms ease-in',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
      transition(':leave', [
        animate(
          '200ms ease-out',
          style({ opacity: 0, transform: 'translateY(-10px)' })
        ),
      ]),
    ]),
    // Animación para los elementos de la lista
    trigger('listAnimation', [
      transition('* => *', [
        query(
          ':enter',
          [
            style({ opacity: 0, transform: 'translateY(20px)' }),
            stagger(50, [
              animate(
                '300ms ease-out',
                style({ opacity: 1, transform: 'translateY(0)' })
              ),
            ]),
          ],
          { optional: true }
        ),
      ]),
    ]),
  ],
})
export class VehiclesDirectoryDialogComponent implements OnInit {
  states: States[] = [];
  isLoading: boolean = true;

  @ViewChild(MatSelectionList) selectionList!: MatSelectionList;

  constructor(
    private apiService: ApiService,
    private jwtService: JwtService,
    private dialogRef: MatDialogRef<VehiclesDirectoryDialogComponent>
  ) {}

  ngOnInit(): void {
    this.listStates();
  }

  private getCompany() {
    const userData = this.jwtService.getUserData();
    return userData ? userData.empresa : '';
  }

  private getUser() {
    const userData = this.jwtService.getUserData();
    return userData ? userData.id : '';
  }

  listStates(): void {
    const company = this.getCompany();

    this.apiService.getData('states/' + company).subscribe(
      (response: States[]) => {
        this.states = response.filter(
          (state) => state.id && state.id.trim() !== ''
        );
        this.isLoading = false;
      },
      (error) => {
        console.error(error);
      }
    );
  }

  onConfirm() {
    const selectedOptions = this.selectionList.selectedOptions.selected;
    let selectedOptionsAll: any[] = [];

    if (selectedOptions.length === 0) {
      this.selectionList.options.forEach((option) => {
        option.selected = true;
      });
      selectedOptionsAll = this.selectionList.selectedOptions.selected;
    }

    const selectedStates =
      selectedOptions.length > 0 ? selectedOptions : selectedOptionsAll;

    const selectedStatesNames = selectedStates.map((option) => {
      const optionValue = option.value as States;
      return optionValue.id;
    });

    const statesToSave = {
      company_code: this.getCompany(),
      user_code: this.getUser(),
      states: selectedStatesNames,
    };

    localStorage.setItem('pdfEndpoint', 'directorio-vehiculos');
    localStorage.setItem('pdfData', JSON.stringify(statesToSave));
    window.open(`/pdf`, '_blank');

    this.dialogRef.close(true);
  }
}
