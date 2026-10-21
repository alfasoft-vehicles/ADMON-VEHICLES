import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { JwtService } from 'src/app/services/jwt.service';

export interface OwnerData {
  codigo: string;
  nombre_propietario: string;
  ruc: string;
  telefono: string;
  celular: string;
  representante: string;
  central: string;
  auditor: string;
  cnt: string;
  dcto: number;
  estado: string;
}

@Component({
  selector: 'app-owners-table',
  templateUrl: './owners-table.component.html',
  styleUrls: ['./owners-table.component.css'],
})
export class OwnersTableComponent implements OnInit, AfterViewInit, OnDestroy {
  subscriptions$: Subscription[] = [];
  displayedColumns: string[] = [
    'Codigo',
    'NombrePropietario',
    'RUC',
    'Telefono',
    'Representante',
    'Central',
    'Auditor',
    'CNT',
    'DCTO',
    'Estado',
  ];

  dataSource: MatTableDataSource<OwnerData>;
  searchControl = new FormControl('');
  filterControl = new FormControl('');
  isLoading: boolean = true;
  originalData: OwnerData[] = [];
  totalOwners: number = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private jwtService: JwtService
  ) {
    this.dataSource = new MatTableDataSource<OwnerData>([]);
  }

  ngOnInit(): void {
    this.fetchData();
    this.getTotalOwners();
    this.setupSearchListener();
  }

  setupSearchListener() {
    this.subscriptions$ = [
      ...this.subscriptions$,
      this.searchControl.valueChanges
        .pipe(debounceTime(100), distinctUntilChanged())
        .subscribe(() => {
          this.applyFilter();
        }),
    ];
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private getUser() {
    const userData = this.jwtService.getUserData();
    return userData ? userData.id : '';
  }

  private getCompany() {
    const userData = this.jwtService.getUserData();
    return userData ? userData.empresa : '';
  }

  getTotalOwners() {
    const company = this.getCompany();
    this.subscriptions$ = [
      ...this.subscriptions$,
      this.apiService.getData('owners-count/' + company).subscribe(
        (response) => {
          this.totalOwners = response.owners_count;
        },
        (error) => {
          console.error('Error fetching total owners:', error);
        }
      ),
    ];
  }

  fetchData() {
    this.isLoading = true;
    const company = this.getCompany();
    this.subscriptions$ = [
      ...this.subscriptions$,
      this.apiService.getData('owners/all/' + company).subscribe(
        (response) => {
          let filteredResponse = response.filter((data: any) => data.codigo);
          filteredResponse.sort((a: OwnerData, b: OwnerData) =>
            a.nombre_propietario.localeCompare(b.nombre_propietario)
          );
          this.originalData = filteredResponse;
          this.dataSource.data = filteredResponse;
          this.isLoading = false;
        },
        (error) => {
          this.isLoading = false;
        }
      ),
    ];
  }

  applyFilter() {
    const searchTerm = this.searchControl.value?.trim().toLowerCase() || '';
    this.dataSource.filter = searchTerm;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  goToOwnerResume(codigo: string) {
    this.router.navigate(['/owner', codigo]);
  }

  openExternalLink(): void {
    localStorage.setItem('pdfEndpoint', 'directorio-propietarios/' + this.getCompany() + '/' + this.getUser());
    localStorage.setItem('pdfData', '0');
    window.open(`/pdf`, '_blank');
  }

  ngOnDestroy(): void {
    this.subscriptions$.forEach((sub) => sub.unsubscribe());
  }
}
