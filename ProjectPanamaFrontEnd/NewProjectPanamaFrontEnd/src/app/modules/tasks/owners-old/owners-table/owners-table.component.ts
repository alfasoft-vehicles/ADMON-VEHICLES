import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { JwtService } from 'src/app/services/jwt.service';

@Component({
  selector: 'app-table-owners',
  templateUrl: './owners-table.component.html',
  styleUrls: ['./owners-table.component.css']
})
export class OwnersTableComponent implements OnInit {
  data: any[] = [];
  filteredData: any[] = [];
  searchTerm: string = '';
  user: any;
  isLoading: boolean = true;
  isModalVisible: boolean = false;

  constructor(
    private apiService: ApiService, 
    private router: Router,
    private jwtService: JwtService) {}

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
    this.apiService.getData('owners/all/'+company).subscribe(
      (response) => {
        this.data = response.filter((data: any) => data.codigo);
        this.data.sort((a, b) => a.nombre_propietario.localeCompare(b.nombre_propietario));
        this.filteredData = [...this.data]; 
        this.isLoading = false;
      },
      (error) => {
        console.error(error);
        this.isLoading = false;
      }
    );
  }

  getUser() {
    this.user = this.jwtService.getUserData();
    this.user = this.user.nombre;
  }

  filterData() {
    const term = this.searchTerm.toLowerCase();
    this.filteredData = this.data.filter(item => 
      item.codigo.toString().toLowerCase().includes(term) ||
      item.nombre_propietario.toLowerCase().includes(term) ||
      item.representante.toLowerCase().includes(term) ||
      item.central.toLowerCase().includes(term) ||
      item.auditor.toLowerCase().includes(term) ||
      item.estado.toLowerCase().includes(term)
    );
  }

  goToOwnerResume(codigo: string) {
    this.router.navigate(['/owner', codigo]);
  }

  openExternalLink(): void {
    this.isLoading = true;
    localStorage.setItem('pdfEndpoint', 'directorio-propietarios');
    localStorage.setItem('pdfData', '0');
    window.open(`/pdf`, '_blank')
    this.router.navigate(['/home/users']);
  }

  showModal() {
    this.isModalVisible = true;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  hideModal() {
    this.isModalVisible = false;
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }

  // openExternalLink(): void {
  //   this.isLoading = true;
  //   const data = { user: this.user };
  //   this.apiService.getPdf("directorio-propietarios").subscribe(
  //     response => {
  //       const blob = new Blob([response], { type: 'application/pdf' });
  //       const url = window.URL.createObjectURL(blob);
  //       const viewerUrl = this.router.serializeUrl(
  //         this.router.createUrlTree(['/pdf', { url }])
  //       );
  //       window.open(viewerUrl, '_blank'); // Abrir en una nueva pestaña
  //       this.router.navigate(['/home']);
  //     },
  //     error => {
  //       console.error('Error al generar el informe:', error);
  //     }
  //   );
  // }
}