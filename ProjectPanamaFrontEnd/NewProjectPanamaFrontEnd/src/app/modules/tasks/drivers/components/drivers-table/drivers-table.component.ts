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
    private loadingService: LoadingService,
    private infoCompanyState: InfoCompanyStateService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
  ) {
    this.dataSource = new MatTableDataSource<DriverData>([]);
  }

  ngOnInit(): void {
    this.initHeaderMeta();
    this.getInfoCompany();
    this.fetchData();
    this.getTotalDrivers();
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
    this.loadingService.show({
      title: 'Cargando Conductores',
      message: 'Obteniendo el listado de conductores desde el servidor...',
      submessage: 'Por favor espere un momento',
    });
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
          this.loadingService.hide();
          setTimeout(() => this.calculateDynamicPageSize(), 0);
        },
        (error) => {
          this.isLoading = false;
          this.loadingService.hide();
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

  listData(eventOrValue: any) {
    const selectedValue =
      eventOrValue && typeof eventOrValue === 'object' && 'value' in eventOrValue
        ? eventOrValue.value
        : (eventOrValue ?? '');
    this.filterControl.setValue(selectedValue, { emitEvent: false });

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

    const availableHeight = Math.max(180, window.innerHeight - rect.top - 82);

    const headerEl = containerEl.querySelector(
      'tr.mat-mdc-header-row'
    ) as HTMLElement | null;
    const rowEl = containerEl.querySelector(
      'tr.dr-data-row'
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
