import { Component, OnInit } from '@angular/core';
import { InfoCompany } from '../../interfaces/info-company.interface';
import { InfoCompanyStateService } from 'src/app/modules/shared/services/info-company-state.service';

@Component({
  selector: 'app-info-company',
  templateUrl: './info-company.component.html',
  styleUrls: ['./info-company.component.css'],
})
export class InfoCompanyComponent implements OnInit {
  displayedColumns: string[] = [
    'name',
    'ruc',
    'address',
    'city',
    'phone',
    'email',
  ];

  infoCompany!: InfoCompany;

  constructor(private infoCompanyStateService: InfoCompanyStateService) {}

  ngOnInit(): void {
    this.getInfoCompany();
  }

  getInfoCompany(): void {
    this.infoCompanyStateService.loadInfoCompany().subscribe((response) => {
      if (response) {
        this.infoCompany = {
          name: response.name,
          ruc: response.ruc || response.nit || '',
          address: response.address || response.direction || '',
          city: response.city,
          phone: response.phone,
          email: response.email,
          logo: response.logo,
        };
      }
    });
  }
}
