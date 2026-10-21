import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { JwtService } from 'src/app/services/jwt.service';
import {
  trigger,
  state,
  style,
  transition,
  animate,
  query,
  stagger,
} from '@angular/animations';
import { MatSelectionList } from '@angular/material/list';
import { SelectedOwnersStateService } from 'src/app/modules/home/services/selected-owners-state.service';
import { MatDialogRef } from '@angular/material/dialog';

interface Owner {
  id: string;
  name: string;
}

@Component({
  selector: 'app-cobros',
  templateUrl: './cobros.component.html',
  styleUrls: ['./cobros.component.css'],
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
export class CobrosComponent implements OnInit {
  owners: Owner[] = [];
  isLoading: boolean = true;

  @ViewChild(MatSelectionList) selectionList!: MatSelectionList;

  constructor(private apiService: ApiService, private jwtService: JwtService, private selectedOwnersState: SelectedOwnersStateService, private dialogRef: MatDialogRef<CobrosComponent>) {}

  ngOnInit(): void {
    this.listOwners();
  }

  listOwners(): void {
    const userData = this.jwtService.getUserData();
    const owner = {
      propietario: userData ? userData.id : null,
    };

    this.apiService.postData('companies_per_owners', owner).subscribe(
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

  onConfirm() {
    const selectedOptions = this.selectionList.selectedOptions.selected;
    let selectedOptionsAll: any[] = [];

    if (selectedOptions.length === 0) {
      this.selectionList.options.forEach(option => {
        option.selected = true;
      });
      selectedOptionsAll = this.selectionList.selectedOptions.selected;
    }

    const selectedOwners = selectedOptions.length > 0 ? selectedOptions : selectedOptionsAll;

    const selectedOwnerNames = selectedOwners.map(option => {
      const optionValue = option.value as Owner;
      return optionValue.id;
    });

    const ownersToSave = {
      owners: selectedOwnerNames
    };

    this.selectedOwnersState.setSelectedOwners(ownersToSave);

    this.dialogRef.close(true);
  }
}
