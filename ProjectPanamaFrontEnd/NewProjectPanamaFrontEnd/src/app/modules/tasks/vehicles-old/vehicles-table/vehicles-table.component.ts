import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { Router } from '@angular/router';
import { JwtService } from 'src/app/services/jwt.service';

@Component({
  selector: 'app-vehicles-table',
  templateUrl: './vehicles-table.component.html',
  styleUrls: ['./vehicles-table.component.css']
})
export class VehiclesTableComponent {
  data: any[] = [];
  user: any;
  filteredData: any[] = [];
  searchTerm: string = '';
  isLoading: boolean = true;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private jwtService: JwtService
  ) {}

  ngOnInit(): void {
    this.fetchData();
    this.getUser();
  }

  getCompany() {
    const userData = this.jwtService.getUserData();
    return userData ? userData.empresa : '';
  }

  fetchData() {
    const company = this.getCompany();
    this.apiService.getData('vehicles/all/'+company).subscribe(
      (response) => {
        this.data = response.filter((data: any) => data.unidad);
        this.data.sort((a, b) => a.unidad.localeCompare(b.unidad));
        this.filteredData = [...this.data];
        this.isLoading = false;
      },
      (error) => {
        console.error(error);
        this.isLoading = false;
      }
    );
  }

  filterData() {
    const term = this.searchTerm.toLowerCase();
    this.filteredData = this.data.filter(item => 
      item.unidad.toString().toLowerCase().includes(term) ||
      item.placa.toLowerCase().includes(term) ||
      item.nro_cupo.toLowerCase().includes(term) ||
      item.permiso.toLowerCase().includes(term) ||
      item.empresa.toLowerCase().includes(term) ||
      item.conductor.toLowerCase().includes(term) ||
      item.nombre_estado.toLowerCase().includes(term)
    );
  }

  listData(event: any) {
    const selectedValue = event.target.value;
    this.filteredData = this.data.filter(item => 
      item.estado.toString().toLowerCase().includes(selectedValue)
    );
  }

  formatDate(dateString: string): string {
    if (dateString == "0000-00-00 00:00:00") {
      return "-";
    }
    return dateString.split('T')[0];
  }

  getUser() {
    this.user = this.jwtService.getUserData();
    this.user = this.user.nombre;
  }

  goToVehicleResume(codigo: string) {
    this.router.navigate(['/vehicle', codigo]);
  }

  openExternalLink(): void {
    this.isLoading = true;
    const data = { user: this.user };
    localStorage.setItem('pdfEndpoint', 'directorio-vehiculos/' + this.getCompany());
    localStorage.setItem('pdfData', '0');
    window.open(`/pdf`, '_blank')
    this.router.navigate(['/home/users']);
  }

}
