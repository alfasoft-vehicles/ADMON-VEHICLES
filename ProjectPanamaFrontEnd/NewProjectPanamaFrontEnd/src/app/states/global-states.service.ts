import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { InfoCompanyStateService } from '../modules/shared/services/info-company-state.service';
import { InfoCompany } from '../interfaces/info-company.interface';
import { SelectedOwnersStateService } from '../modules/home/services/selected-owners-state.service';

@Injectable({
  providedIn: 'root',
})
export class GlobalStatesService {
  // * Inyectamos el servicio InfoCompanyStateService para poder acceder a sus métodos y propiedades
  private infoCompanyStateService = inject(InfoCompanyStateService);

  public setInfoCompany(infoCompany: InfoCompany): void {
    this.infoCompanyStateService.setInfoCompany(infoCompany);
  }

  public loadInfoCompany(): Observable<InfoCompany | null> {
    return this.infoCompanyStateService.loadInfoCompany();
  }

  public clearInfoCompany(): void {
    this.infoCompanyStateService.clearInfoCompany();
  }

  public displayInfoCompany = this.infoCompanyStateService.displayInfoCompany;
  public getInfoCompany = this.infoCompanyStateService.getInfoCompany;

  // * Inyectamos el servicio SelectedOwnersStateService para poder acceder a sus métodos y propiedades
  private selectedOwnersCobrosStateService = inject(SelectedOwnersStateService);

  public getSelectedOwners =
    this.selectedOwnersCobrosStateService.getSelectedOwners;

  public clearSelectedOwners(): void {
    this.selectedOwnersCobrosStateService.clearSelectedOwners();
  }
}
