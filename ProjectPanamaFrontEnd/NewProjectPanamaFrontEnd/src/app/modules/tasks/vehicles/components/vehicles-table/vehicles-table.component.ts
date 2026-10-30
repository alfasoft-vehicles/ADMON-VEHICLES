import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  NgZone,
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
import { LoadingService } from 'src/app/services/loading.service';
import { InfoCompanyStateService } from 'src/app/modules/shared/services/info-company-state.service';
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
  infoCompanyName: string = '';
  currentDateFormatted: string = '';

  pageSize: number = 10;
  pageSizeOptions: number[] = [10, 20, 30, 40, 50, 100];
  private basePageSizeOptions: number[] = [10, 20, 30, 40, 50, 100];
  private resizeObserver?: ResizeObserver;
  private resizeDebounceTimer?: ReturnType<typeof setTimeout>;

  @ViewChild('tableScrollContainer')
  tableScrollContainer!: ElementRef<HTMLElement>;

  private paginatorRef!: MatPaginator;
  private sortRef!: MatSort;

  @ViewChild(MatPaginator) set paginator(mp: MatPaginator) {
    if (mp) {
      this.paginatorRef = mp;
      this.dataSource.paginator = this.paginatorRef;
    }
  }

  @ViewChild(MatSort) set sort(ms: MatSort) {
    if (ms) {
      this.sortRef = ms;
      this.dataSource.sort = this.sortRef;
    }
  }

  constructor(
    private apiService: ApiService,
    private router: Router,
    private jwtService: JwtService,
    private breakpointObserver: BreakpointObserver,
    private dialog: MatDialog,
    private loadingService: LoadingService,
    private infoCompanyState: InfoCompanyStateService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
  ) {
    this.dataSource = new MatTableDataSource<VehicleData>([]);
  }

  ngOnInit(): void {
    this.initHeaderMeta();
    this.getInfoCompany();
    this.fetchData();
    this.getUser();
    this.getTotalVehicles();
    this.setupSearchListener();
  }

  private initHeaderMeta(): void {
    const now = new Date();
    const formatted = now.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    this.currentDateFormatted =
      formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  private getInfoCompany(): void {
    this.infoCompanyState.loadInfoCompany().subscribe({
      next: (info) => {
        if (info?.name) {
          this.infoCompanyName = info.name;
        }
      },
      error: (err) => {
        console.error('Error fetching company info:', err);
      },
    });
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
    if (this.paginatorRef) {
      this.dataSource.paginator = this.paginatorRef;
    }
    if (this.sortRef) {
      this.dataSource.sort = this.sortRef;
    }
    this.setupResizeObserver();
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
        },
      ),
    ];
  }

  fetchData() {
    this.isLoading = true;
    this.loadingService.show({
      title: 'Cargando Vehículos',
      message: 'Obteniendo el listado de vehículos desde el servidor...',
      submessage: 'Por favor espere un momento',
    });
    const company = this.getCompany();
    this.subscriptions$ = [
      ...this.subscriptions$,
      this.apiService.getData('vehicles/all/' + company).subscribe(
        (response) => {
          let filteredResponse = response.filter((data: any) => data.unidad);
          filteredResponse.sort((a: VehicleData, b: VehicleData) =>
            a.unidad.localeCompare(b.unidad),
          );
          this.originalData = filteredResponse;
          this.dataSource.data = filteredResponse;
          this.isLoading = false;
          this.loadingService.hide();
          setTimeout(() => this.calculateDynamicPageSize(), 0);
        },
        (error) => {
          this.isLoading = false;
          this.loadingService.hide();
        },
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

  listData(eventOrValue: any) {
    const selectedValue =
      eventOrValue &&
      typeof eventOrValue === 'object' &&
      'value' in eventOrValue
        ? eventOrValue.value
        : (eventOrValue ?? '');
    this.filterControl.setValue(selectedValue, { emitEvent: false });

    if (!selectedValue) {
      this.dataSource.data = this.originalData;
    } else {
      this.dataSource.data = this.originalData.filter((item) =>
        item.estado
          ? item.estado.toString().toLowerCase().includes(selectedValue)
          : false,
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

  @HostListener('window:resize')
  onWindowResize(): void {
    this.scheduleDynamicPageSizeCalculation();
  }

  private setupResizeObserver(): void {
    if (
      typeof ResizeObserver === 'undefined' ||
      !this.tableScrollContainer?.nativeElement
    ) {
      return;
    }

    this.resizeObserver = new ResizeObserver(() => {
      this.ngZone.run(() => {
        this.scheduleDynamicPageSizeCalculation();
      });
    });

    this.resizeObserver.observe(this.tableScrollContainer.nativeElement);
  }

  private scheduleDynamicPageSizeCalculation(): void {
    if (this.isLoading) return;
    if (this.resizeDebounceTimer) {
      clearTimeout(this.resizeDebounceTimer);
    }
    this.resizeDebounceTimer = setTimeout(() => {
      this.calculateDynamicPageSize();
    }, 60);
  }

  private calculateDynamicPageSize(): void {
    if (this.isLoading || !this.tableScrollContainer?.nativeElement) return;

    const containerEl = this.tableScrollContainer.nativeElement;
    const rect = containerEl.getBoundingClientRect();
    if (rect.height === 0 && rect.top === 0) return;

    // Alto disponible desde el inicio de la zona de la tabla hasta el borde inferior de la ventana
    // Restando la altura del paginador (~56px) y el padding/borde inferior (~26px)
    const availableHeight = Math.max(180, window.innerHeight - rect.top - 82);

    const headerEl = containerEl.querySelector(
      'tr.mat-mdc-header-row',
    ) as HTMLElement | null;
    const rowEl = containerEl.querySelector(
      'tr.vh-data-row',
    ) as HTMLElement | null;

    const headerHeight = headerEl?.offsetHeight || 34;
    const rowHeight = rowEl?.offsetHeight || 36;

    const bodyAvailableHeight = availableHeight - headerHeight;
    const fittingRows = Math.floor(bodyAvailableHeight / rowHeight);
    const calculatedSize = Math.max(5, fittingRows);

    const optionsSet = new Set<number>([
      ...this.basePageSizeOptions,
      calculatedSize,
    ]);
    this.pageSizeOptions = Array.from(optionsSet).sort((a, b) => a - b);

    if (
      this.pageSize !== calculatedSize ||
      this.paginatorRef?.pageSize !== calculatedSize
    ) {
      this.pageSize = calculatedSize;
      if (this.paginatorRef) {
        this.paginatorRef._changePageSize(calculatedSize);
      }
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy(): void {
    if (this.resizeDebounceTimer) {
      clearTimeout(this.resizeDebounceTimer);
    }
    this.resizeObserver?.disconnect();
    this.loadingService.hide();
    this.subscriptions$.forEach((sub) => sub.unsubscribe());
  }
}
