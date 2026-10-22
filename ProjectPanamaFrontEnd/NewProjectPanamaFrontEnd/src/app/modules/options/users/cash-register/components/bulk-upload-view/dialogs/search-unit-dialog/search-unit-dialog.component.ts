import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, Subject, Subscription } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  switchMap,
  tap,
} from 'rxjs/operators';
import { BulkUploadRecord } from '../../models/bulk-upload-record.interface';
import { ConfirmActionDialogComponent } from 'src/app/modules/shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { ApiService } from 'src/app/services/api.service';
import { JwtService } from 'src/app/services/jwt.service';
import { ErrorHandlerService } from 'src/app/services/error-handler.service';

export interface VehicleSearchItem {
  unidad: string;
  placa: string;
  conductor: string;
  cedula: string;
  empresa: string;
  estado: string;
  nroCupo: string;
  propietario: string;
  codigoConductor: string;
  telefono: string;
  valorCuota: number;
  cuotasTotales: number;
  cuotasPagas: number;
  cuotasPendientes: number;
}

export interface SearchUnitDialogData {
  record: BulkUploadRecord;
  companyCode?: string;
}

@Component({
  selector: 'app-search-unit-dialog',
  templateUrl: './search-unit-dialog.component.html',
  styleUrls: ['./search-unit-dialog.component.css'],
})
export class SearchUnitDialogComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('searchInput') searchInputEl?: ElementRef<HTMLInputElement>;

  searchTerm: string = '';
  selectedVehicle: VehicleSearchItem | null = null;
  filteredVehicles: VehicleSearchItem[] = [];

  isLoading: boolean = false;
  hasSearched: boolean = false;
  errorMessage: string = '';

  private searchSubject = new Subject<string>();
  private searchSub?: Subscription;

  get isAlreadyIdentified(): boolean {
    return Boolean(this.data.record.unidad && !this.data.record.hasAlert);
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SearchUnitDialogData,
    private dialogRef: MatDialogRef<SearchUnitDialogComponent>,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private apiService: ApiService,
    private jwtService: JwtService,
  ) {}

  ngOnInit(): void {
    // Configurar búsqueda reactiva con debounce de 350ms
    this.searchSub = this.searchSubject
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        switchMap((term) => {
          const cleanTerm = (term || '').trim();
          if (!cleanTerm) {
            this.filteredVehicles = [];
            this.hasSearched = false;
            this.errorMessage = '';
            this.isLoading = false;
            return of([]);
          }
          if (cleanTerm.length < 3) {
            this.filteredVehicles = [];
            this.hasSearched = false;
            this.errorMessage = 'La búsqueda debe tener al menos 3 caracteres';
            this.isLoading = false;
            return of([]);
          }
          return this.fetchSearchResults(cleanTerm);
        }),
      )
      .subscribe();

    // Si el registro tiene algún indicio de unidad o comentario, pre-filtrar
    if (
      this.data.record.identifica &&
      this.data.record.identifica.trim().length >= 3
    ) {
      this.searchTerm = this.data.record.identifica.trim();
      this.executeSearch(this.searchTerm);
    } else if (
      this.data.record.unidad &&
      this.data.record.unidad.trim().length >= 3
    ) {
      this.searchTerm = this.data.record.unidad.trim();
      this.executeSearch(this.searchTerm);
    } else if (this.data.record.identifica) {
      this.searchTerm = this.data.record.identifica.trim();
    } else if (this.data.record.unidad) {
      this.searchTerm = this.data.record.unidad.trim();
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.searchInputEl) {
        this.searchInputEl.nativeElement.focus();
        if (this.searchTerm) {
          this.searchInputEl.nativeElement.select();
        }
      }
    }, 150);
  }

  ngOnDestroy(): void {
    if (this.searchSub) {
      this.searchSub.unsubscribe();
    }
  }

  /**
   * Disparado mientras el usuario escribe en el input
   */
  onSearchInput(): void {
    this.selectedVehicle = null;
    this.errorMessage = '';
    const term = (this.searchTerm || '').trim();
    if (!term) {
      this.filteredVehicles = [];
      this.hasSearched = false;
      this.isLoading = false;
    }
    this.searchSubject.next(term);
  }

  /**
   * Búsqueda inmediata al hacer clic en el botón Buscar o presionar Enter
   */
  onSearchImmediate(): void {
    this.selectedVehicle = null;
    const term = (this.searchTerm || '').trim();
    if (!term) {
      this.filteredVehicles = [];
      this.hasSearched = false;
      this.errorMessage = '';
      return;
    }
    if (term.length < 3) {
      this.filteredVehicles = [];
      this.hasSearched = false;
      this.errorMessage = 'La búsqueda debe tener al menos 3 caracteres';
      return;
    }
    this.executeSearch(term);
  }

  /**
   * Ejecuta la llamada al backend directamente
   */
  executeSearch(term: string): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.fetchSearchResults(term).subscribe();
  }

  /**
   * Consulta el endpoint de búsqueda básica /search/basic-info/{company_code}/?q=...
   */
  private fetchSearchResults(term: string) {
    this.isLoading = true;
    this.errorMessage = '';
    const companyCode = this.getCompany();
    if (!companyCode) {
      this.isLoading = false;
      this.hasSearched = true;
      this.filteredVehicles = [];
      this.errorMessage = 'No se encontró la empresa del usuario autenticado.';
      return of([]);
    }
    const endpoint = `search/basic-info/${companyCode}/?q=${encodeURIComponent(term)}`;

    return this.apiService.getData(endpoint, { silent: true }).pipe(
      map((response: any[]) => this.mapBackendResults(response)),
      tap((results) => {
        this.filteredVehicles = results;
        this.hasSearched = true;
        this.isLoading = false;
      }),
      catchError((error) => {
        this.isLoading = false;
        this.hasSearched = true;
        this.filteredVehicles = [];
        this.errorMessage = ErrorHandlerService.getErrorMessage(
          error,
          'No fue posible obtener resultados de búsqueda.',
        );
        return of([]);
      }),
    );
  }

  /**
   * Mapea los resultados del backend al formato VehicleSearchItem
   */
  private mapBackendResults(items: any[]): VehicleSearchItem[] {
    if (!Array.isArray(items)) {
      return [];
    }
    return items.map((raw) => ({
      unidad: (raw.vehicle_number || '').trim(),
      placa: (raw.vehicle_plate || '').trim(),
      conductor: (raw.driver_name || '').trim(),
      cedula: (raw.driver_id_card || '').trim(),
      empresa: (raw.owner_name || 'Sin Propietario').trim(),
      estado: (raw.vehicle_state || 'Activo').trim(),
      nroCupo: (raw.cupo_number || raw.vehicle_number || '').trim(),
      propietario: (raw.owner_name || 'Sin Propietario').trim(),
      codigoConductor: (raw.driver_code || '').trim(),
      telefono: (raw.driver_phone || raw.driver_cellphone || '').trim(),
      valorCuota: Number(raw.daily_fee || 0),
      cuotasTotales: Number(raw.total_accounts || 0),
      cuotasPagas: Number(raw.paid_accounts || 0),
      cuotasPendientes: Number(raw.pending_accounts || 0),
    }));
  }

  getCompany(): string {
    const userData = this.jwtService.getUserData();
    return userData ? (userData.empresa || '').trim() : '';
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filteredVehicles = [];
    this.selectedVehicle = null;
    this.hasSearched = false;
    this.errorMessage = '';
    this.isLoading = false;
    if (this.searchInputEl) {
      this.searchInputEl.nativeElement.focus();
    }
  }

  selectVehicle(vehicle: VehicleSearchItem): void {
    this.selectedVehicle = vehicle;
  }

  changeSelection(): void {
    this.selectedVehicle = null;
    setTimeout(() => {
      if (this.searchInputEl) {
        this.searchInputEl.nativeElement.focus();
        if (this.searchTerm) {
          this.searchInputEl.nativeElement.select();
        }
      }
    }, 100);
  }

  onAccept(): void {
    if (!this.selectedVehicle) {
      return;
    }

    const vehicle = this.selectedVehicle;
    const confirmMessage = `¿Está seguro de asignar la unidad ${vehicle.unidad} (${vehicle.conductor}) al registro de ${this.data.record.nombre}? El registro pasará a estar validado.`;

    const confirmRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '480px',
      maxWidth: '92vw',
      data: {
        documentName: 'Confirmar Asignación de Unidad',
        message: confirmMessage,
      },
    });

    confirmRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.snackBar.open(
          `Unidad ${vehicle.unidad} asignada correctamente al registro de ${vehicle.conductor}.`,
          'Entendido',
          {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          },
        );

        this.dialogRef.close({
          confirmed: true,
          updatedData: {
            unidad: vehicle.unidad,
            nombre: vehicle.conductor,
            cedula: vehicle.cedula,
            codigo: vehicle.codigoConductor,
            estado: vehicle.estado,
            hasAlert: false,
            review: 0,
            pendiente: '0.00',
          },
        });
      } else {
        this.snackBar.open(
          'Acción cancelada. No se realizaron cambios en el registro.',
          'Entendido',
          {
            duration: 3500,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          },
        );
      }
    });
  }

  close(): void {
    this.dialogRef.close(null);
  }
}
