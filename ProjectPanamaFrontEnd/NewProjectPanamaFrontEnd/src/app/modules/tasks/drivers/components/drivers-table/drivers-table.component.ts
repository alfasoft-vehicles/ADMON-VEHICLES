import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { JwtService } from 'src/app/services/jwt.service';

export interface DriverData {
  codigo: string;
  unidad: string;
  nombre: string;
  cedula: string;
  telefono: string;
  fecha_ingreso: string;
  cuota_diaria: string;
  nro_entrega: string;
  nro_pago: string;
  nro_saldo: string;
  vce_licen: string;
  contacto: string;
  contacto1: string;
}

@Component({
  selector: 'app-drivers-table',
  templateUrl: './drivers-table.component.html',
  styleUrls: ['./drivers-table.component.css'],
})
export class DriversTableComponent implements OnInit, AfterViewInit, OnDestroy {
  subscriptions$: Subscription[] = [];
  displayedColumns: string[] = [
    'Codigo',
    'Unidad',
    'Conductor',
    'Cedula',
    'Telefono',
    'FechaIngreso',
    'VlrCuota',
    'NroCuotas',
    'NroPagas',
    'Pendientes',
    'VenceLicencia',
    'Contactos',
  ];

  dataSource: MatTableDataSource<DriverData>;
  searchControl = new FormControl('');
  filterControl = new FormControl('');
  isLoading: boolean = true;
  originalData: DriverData[] = [];
  totalDrivers: number = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private jwtService: JwtService
  ) {
    this.dataSource = new MatTableDataSource<DriverData>([]);
  }

  ngOnInit(): void {
    this.fetchData();
    this.getTotalDrivers();
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

  getTotalDrivers() {
    const company = this.getCompany();
    this.subscriptions$ = [
      ...this.subscriptions$,
      this.apiService.getData('drivers-count/' + company).subscribe(
        (response) => {
          this.totalDrivers = response.drivers_count;
        },
        (error) => {
          console.error('Error fetching total drivers:', error);
        }
      ),
    ];
  }

  fetchData() {
    this.isLoading = true;
    const company = this.getCompany();
    this.subscriptions$ = [
      ...this.subscriptions$,
      this.apiService.getData('drivers/all/' + company).subscribe(
        (response) => {
          let filteredResponse = response.filter((data: any) => data.codigo);
          filteredResponse.sort((a: DriverData, b: DriverData) =>
            a.nombre.localeCompare(b.nombre)
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

  listData(event: any) {
    const selectedValue = event.value;

    if (!selectedValue || selectedValue === '') {
      this.dataSource.data = this.originalData;
    } else if (selectedValue === '1') {
      this.dataSource.data = this.originalData.filter(
        (item) => item.unidad !== ' - '
      );
    }

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  goToDriverResume(codigo: string) {
    this.router.navigate(['/driver', codigo]);
  }

  openExternalLink(): void {
    localStorage.setItem(
      'pdfEndpoint',
      'directorio-conductores/' + this.getCompany() + '/' + this.getUser()
    );
    localStorage.setItem('pdfData', '0');
    window.open(`/pdf`, '_blank');
  }

  ngOnDestroy(): void {
    this.subscriptions$.forEach((sub) => sub.unsubscribe());
  }
}
