import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
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
import { VehiclesDirectoryDialogComponent } from '../dialogs/vehicles-directory-dialog/vehicles-directory-dialog.component';
import { MatDialog } from '@angular/material/dialog';

export interface VehicleData {
  unidad: string;
  placa: string;
  modelo: string;
  nro_cupo: string;
  motor: string;
  chasis: string;
  matricula: string;
  central: string;
  empresa: string;
  conductor: string;
  nombre_estado: string;
  vlr_cta: string;
  nro_ctas: string;
  panapass: string;
  nro_llaves: string;
  consecutivo: string;
  estado?: string;
  saldo?: number;
  clave?: string;
  permiso?: string;
}

@Component({
  selector: 'app-vehicles-table',
  templateUrl: './vehicles-table.component.html',
  styleUrls: ['./vehicles-table.component.css'],
})
export class VehiclesTableComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  subscriptions$: Subscription[] = [];
  displayedColumns: string[] = [
    'Unidad',
    'Placa',
    'Año',
    'Cupo',
    'Motor',
    'Chasis',
    'Matricula',
    'Central',
    'Empresa',
    'Conductor',
    'Estado',
    'Vlr.Cta',
    'N° Ctas',
    'Panapass',
    'Llavero',
  ];

  dataSource: MatTableDataSource<VehicleData>;
  searchControl = new FormControl('');
  filterControl = new FormControl('');
  isLoading: boolean = true;
  originalData: VehicleData[] = [];
  totalVehicles: number = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private jwtService: JwtService,
    private breakpointObserver: BreakpointObserver,
    private dialog: MatDialog
  ) {
    this.dataSource = new MatTableDataSource<VehicleData>([]);
  }

  ngOnInit(): void {
    this.fetchData();
    this.getUser();
    this.getTotalVehicles();
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

  getTotalVehicles() {
    const company = this.getCompany();
    this.subscriptions$ = [
      ...this.subscriptions$,
      this.apiService.getData('vehicles-count/' + company).subscribe(
        (response) => {
          this.totalVehicles = response.vehicle_count;
        },
        (error) => {
          console.error('Error fetching total vehicles:', error);
        }
      ),
    ];
  }

  fetchData() {
    this.isLoading = true;
    const company = this.getCompany();
    this.subscriptions$ = [
      ...this.subscriptions$,
      this.apiService.getData('vehicles/all/' + company).subscribe(
        (response) => {
          let filteredResponse = response.filter((data: any) => data.unidad);
          filteredResponse.sort((a: VehicleData, b: VehicleData) =>
            a.unidad.localeCompare(b.unidad)
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

    if (!selectedValue) {
      this.dataSource.data = this.originalData;
    } else {
      this.dataSource.data = this.originalData.filter((item) =>
        item.estado
          ? item.estado.toString().toLowerCase().includes(selectedValue)
          : false
      );
    }

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  formatDate(dateString: string): string {
    if (!dateString || dateString == '0000-00-00 00:00:00') {
      return '-';
    }
    return dateString.split('T')[0];
  }

  goToVehicleResume(codigo: string) {
    this.router.navigate(['/vehicle', codigo]);
  }

  openVehiclesDirectoryDialog(): void {
    const isSmallScreen = this.breakpointObserver.isMatched(Breakpoints.XSmall);
    const dialogWidth = isSmallScreen ? '90vw' : '60%';

    const dialogRef = this.dialog.open(VehiclesDirectoryDialogComponent, {
      minWidth: 'min(600px, 90vw)',
      maxHeight: '100vh',
      disableClose: true,
    });
  }

  ngOnDestroy(): void {
    this.subscriptions$.forEach((sub) => sub.unsubscribe());
  }
}
