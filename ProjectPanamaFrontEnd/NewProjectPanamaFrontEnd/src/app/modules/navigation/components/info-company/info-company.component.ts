import { Component, OnInit } from '@angular/core';
import { InfoCompany } from '../../interfaces/info-company.interface';
import { ApiService } from 'src/app/services/api.service';
import { JwtService } from 'src/app/services/jwt.service';

interface Transaction {
  name: string;
  ruc: number;
  address: string;
  city: string;
  phone: string;
  email: string;
}

@Component({
  selector: 'app-info-company',
  templateUrl: './info-company.component.html',
  styleUrls: ['./info-company.component.css']
})
export class InfoCompanyComponent implements OnInit {
  displayedColumns: string[] = ['name', 'ruc', 'address', 'city', 'phone', 'email'];

  infoCompany!: InfoCompany;
  
  constructor(
    private apiService: ApiService,
    private jwtService: JwtService // Assuming you have a JwtService for token handling
  ){}

  ngOnInit(): void {
    this.getInfoCompany();
  }

  getInfoCompany(): void {
    const userData = this.jwtService.getUserData();
    const idCompany = userData ? userData.empresa : null;
    this.apiService.getData('info-company/'+idCompany).subscribe(
      (response) => {
        this.infoCompany = response;
      }
    );
  }
}
