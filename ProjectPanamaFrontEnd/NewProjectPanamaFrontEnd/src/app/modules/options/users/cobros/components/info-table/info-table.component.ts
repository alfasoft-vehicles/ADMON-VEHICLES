import {
  AfterViewInit,
  Component,
  ViewChild,
  Renderer2,
  Inject,
  effect,
  OnDestroy,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { FormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ApiService } from 'src/app/services/api.service';
import {
  trigger,
  state,
  style,
  transition,
  animate,
  query,
  stagger,
} from '@angular/animations';
import { GlobalStatesService } from 'src/app/states/global-states.service';
import { Owners } from '../../interfaces/owners.interface';
import { Router } from '@angular/router';
import { DocumentsService } from 'src/app/services/documents.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface VehicleInfoData {
  Unidad: string;
  Condu: string;
  Nombre: string;
  'Vlr.Cta': string;
  Celular: string;
  Ingreso: string;
  'Sdo.Renta': string;
  Deposito: string;
  PanaPass: string | null;
  Siniestro: string;
  'Otra Deu': string;
  Empresa: string;
  Central: string;
  Estado: string;
  DiasSinPago?: number;
  CuotasPendientes?: number;
  Panapass?: string | null;
  MantenimientoFecha?: string | null;
  MantenimientoDiasRestantes?: number | null;
}

interface apiResponse {
  vehiculo_numero?: string;
  conductor?: string;
  conductores_nombre?: string;
  conductores_cuodiaria?: number;
  conductores_celular?: string;
  conductores_fecingres?: string;
  diferencia?: number;
  deu_renta?: number;
  fon_inscri?: number;
  deu_sinies?: number;
  deu_otras?: number;
  nombre?: string;
  centrales_nombre?: string;
  estado?: string;
  dias_sin_pago?: number;
  cuotas_pendientes?: number;
  panapass?: string | null;
  mantenimiento_fecha?: string | null;
  mantenimiento_dias_restantes?: number | null;
}

interface DebtOption {
  text: string;
  color: string;
  hoverColor: string;
  id?: number;
}

@Component({
  selector: 'app-info-table',
  templateUrl: './info-table.component.html',
  styleUrls: ['./info-table.component.css'],
  // animations: [
  //   trigger('fadeInOut', [
  //     transition(':enter', [
  //       style({ opacity: 0, transform: 'translateY(-10px)' }),
  //       animate(
  //         '300ms ease-in',
  //         style({ opacity: 1, transform: 'translateY(0)' })
  //       ),
  //     ]),
  //     transition(':leave', [
  //       animate(
  //         '200ms ease-out',
  //         style({ opacity: 0, transform: 'translateY(-10px)' })
  //       ),
  //     ]),
  //   ]),
  //   // Animación para los elementos de la lista/tabla
  //   trigger('listAnimation', [
  //     transition('* => *', [
  //       query(
  //         ':enter',
  //         [
  //           style({ opacity: 0, transform: 'translateY(20px)' }),
  //           stagger(50, [
  //             animate(
  //               '300ms ease-out',
  //               style({ opacity: 1, transform: 'translateY(0)' })
  //             ),
  //           ]),
  //         ],
  //         { optional: true }
  //       ),
  //     ]),
  //   ]),
  // ],
})
export class InfoTableComponent implements AfterViewInit, OnDestroy {
  isIOS: boolean =
    /iPhone|iPad|iPod/.test(navigator.userAgent) && !('MSStream' in window);

  private originalData: VehicleInfoData[] = [];
  dataIsZero: boolean = false;

  debts = new FormControl<number>(0);

  debtList: DebtOption[] = [
    {
      text: 'Más de 3 Cuotas',
      color: '#FFCDD2',
      hoverColor: '#FFAAAA',
      id: 3,
    },
    {
      text: 'Menor o Igual a 2 Cuotas',
      color: '#FFE0B2',
      hoverColor: '#FFCC80',
      id: 2,
    },
    {
      text: 'Menor o Igual a 1 Cuota',
      color: '#FFF9C4',
      hoverColor: '#FFF176',
      id: 1,
    },
    {
      text: 'Sin Deuda',
      color: '#C8E6C9',
      hoverColor: '#A5D6A7',
      id: 4,
    },
    {
      text: 'Todos',
      color: '#ADD8E6',
      hoverColor: '#90CAF9',
      id: 0,
    },
  ];

  selectedDebtLevel: number = 0;

  displayedColumns: string[] = [
    'Unidad',
    'Condu',
    'Nombre',
    'Vlr.Cta',
    'Celular',
    'Ingreso',
    'Sin Pagar',
    'Sdo.Renta',
    'Deposito',
    'PanaPass',
    'Siniestro',
    'Mantenimien',
    'Otra Deu',
    'Empresa',
    'Central',
    'Estado',
  ];
  dataSource: MatTableDataSource<VehicleInfoData>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private apiService: ApiService,
    private globalStates: GlobalStatesService,
    private renderer: Renderer2,
    private router: Router,
    private documentsService: DocumentsService,
    private snackBar: MatSnackBar,
    @Inject(DOCUMENT) private document: Document,
  ) {
    this.dataSource = new MatTableDataSource<VehicleInfoData>([]);

    effect(() => {
      const selectedOwners = this.globalStates.getSelectedOwners();

      if (selectedOwners.owners.length > 0) {
        this.getTableData(selectedOwners);

        // TODO: Limpiar info guardada en los estados globales una vez se deja de utilizar
        // this.globalStates.clearSelectedOwners();
      }
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.generateHoverStyles();
    this.validatedOwnersList();
  }

  validatedOwnersList() {
    const selectedOwners = this.globalStates.getSelectedOwners();
    if (selectedOwners.owners.length === 0) {
      this.router.navigate(['/home/users']);
    }
  }

  getSelectedDebtText(): string {
    const selectedDebt = this.debtList.find(
      (debt) => debt.id === this.debts.value,
    );
    return selectedDebt ? selectedDebt.text : 'Todos';
  }

  generateHoverStyles() {
    // Eliminar estilos previos si existen
    const existingStyle = this.document.getElementById('debt-hover-styles');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Crear nuevo elemento style
    const style = this.renderer.createElement('style');
    this.renderer.setAttribute(style, 'id', 'debt-hover-styles');

    let css = `
      .mat-mdc-option {
        margin: 1px !important;
        border-radius: 4px !important;
      }
    `;

    this.debtList.forEach((debt, index) => {
      css += `
        .debt-option-${index}:hover {
          background-color: ${debt.hoverColor} !important;
        }
      `;
    });

    this.renderer.setProperty(style, 'textContent', css);
    this.renderer.appendChild(this.document.head, style);
  }

  onDebtSelectionChange(event: any) {
    this.selectedDebtLevel = event.value;
    this.filterByDebtLevel(this.selectedDebtLevel);
  }

  filterByDebtLevel(debtLevelId: number) {
    // Usar originalData en lugar de dataSource.data
    let filteredData: VehicleInfoData[];

    switch (debtLevelId) {
      case 1: // Menor o Igual a 1 Cuota
        filteredData = this.originalData.filter(
          (row) => (row.CuotasPendientes || 0) <= 1,
        );
        break;

      case 2: // Menor o Igual a 2 Cuotas
        filteredData = this.originalData.filter(
          (row) => (row.CuotasPendientes || 0) <= 2,
        );
        break;

      case 3: // Más de 3 Cuotas
        filteredData = this.originalData.filter(
          (row) => (row.CuotasPendientes || 0) > 3,
        );
        break;

      case 4: // Sin Deuda
        filteredData = this.originalData.filter(
          (row) => (row.CuotasPendientes || 0) === 0,
        );
        break;

      case 0: // Todos
      default:
        filteredData = this.originalData;
        break;
    }

    // Aplicar los datos filtrados
    this.dataSource.data = filteredData;

    // Resetear el paginador a la primera página
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  getTableData(selectedOwners: Owners) {
    this.apiService.postData('collection-accounts', selectedOwners).subscribe({
      next: (response) => {
        const mappedData: VehicleInfoData[] = response.map(
          (item: apiResponse) => {
            return {
              Unidad: item.vehiculo_numero || '',
              Condu: item.conductor || '',
              Nombre: item.conductores_nombre || '',
              'Vlr.Cta':
                item.conductores_cuodiaria !== undefined
                  ? item.conductores_cuodiaria.toString()
                  : '0',
              Celular: item.conductores_celular || '',
              Ingreso: item.conductores_fecingres || 'N/A',
              'Sin Pagar': '',
              'Sdo.Renta':
                item.deu_renta !== undefined ? item.deu_renta.toString() : '0',
              Deposito:
                item.fon_inscri !== undefined
                  ? item.fon_inscri.toString()
                  : '0',
              Siniestro:
                item.deu_sinies !== undefined
                  ? item.deu_sinies.toString()
                  : '0',
              Mantenimien: '',
              'Otra Deu':
                item.deu_otras !== undefined ? item.deu_otras.toString() : '0',
              Empresa: item.nombre || '',
              Central: item.centrales_nombre || '',
              Estado: item.estado || '',
              DiasSinPago: item.dias_sin_pago || 0,
              CuotasPendientes: item.cuotas_pendientes || 0,
              PanaPass: item.panapass || '',
              MantenimientoFecha: item.mantenimiento_fecha,
              MantenimientoDiasRestantes: item.mantenimiento_dias_restantes,
            };
          },
        );

        // Guardar datos originales y aplicar al dataSource
        this.originalData = [...mappedData];
        this.dataSource.data = mappedData;

        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
        if (this.sort) {
          this.dataSource.sort = this.sort;
        }

        if (this.originalData.length === 0) {
          this.dataIsZero = true;
          this.openSnackbar('No hay datos disponibles para mostrar.');
        } else {
          this.dataIsZero = false;
          this.openSnackbar('Datos cargados correctamente.');
        }
      },
      error: (error) => {
        console.error('Error fetching data:', error);
        this.dataIsZero = true;
      },
    });
  }

  getMaintenanceColor(diasRestantes: number | null): string {
    if (diasRestantes === null || diasRestantes === undefined) {
      return 'transparent'; // Sin color si no hay datos
    }

    if (diasRestantes <= 0) {
      return '#FFCDD2'; // Fecha actual o más (vencido)
    } else if (diasRestantes <= 5) {
      return '#FFE0B2'; // 5 días o menos
    } else {
      return '#C8E6C9'; // Más de 5 días
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  downloadCollectionAccountsXLS() {
    const selectedOwners = this.globalStates.getSelectedOwners();
    if (selectedOwners.owners.length === 0) {
      console.error('No owners selected for XLS download');
      this.openSnackbar(
        'No hay propietarios seleccionados para descargar el reporte.',
      );
      return;
    }

    this.openSnackbar(
      'En un momento se descargará el reporte de cuentas de cobro.',
    );

    this.documentsService
      .downloadDocument(
        'collection-accounts/download',
        selectedOwners,
        'reporte_cuentas_cobro.xlsx',
      )
      .subscribe({
        next: () => {},
        error: (error) => {
          console.error('Download failed:', error);
        },
      });
  }

  downloadCollectionAccountsPDF() {
    const selectedOwners = this.globalStates.getSelectedOwners();
    if (selectedOwners.owners.length === 0) {
      console.error('No owners selected for PDF download');
      this.openSnackbar(
        'No hay propietarios seleccionados para descargar el reporte.',
      );
      return;
    }

    this.openSnackbar(
      'En un momento se descargará el reporte de cuentas de cobro.',
    );

    // -- LÓGICA ESPECIAL PARA iOS --
    if (this.isIOS) {
      this.openSnackbar(
        'Descargando reporte de cuentas de cobro en PDF iOS...',
      );
      // almacenamos endpoint y data para el PdfViewerComponent
      localStorage.setItem('pdfEndpoint', 'collection-accounts/download-pdf');
      localStorage.setItem('pdfData', JSON.stringify(selectedOwners));
      // navegamos a la ruta donde tienes <app-pdf-viewer>
      window.open(`/pdf`, '_blank');
      return;
    }

    // -- COMPORTAMIENTO POR DEFECTO para Android y demás --
    this.documentsService
      .downloadDocument(
        'collection-accounts/download-pdf',
        selectedOwners,
        'reporte_cuentas_cobro.pdf',
      )
      .subscribe({
        next: () => {},
        error: (error) => {
          console.error('Download failed:', error);
        },
      });
  }

  nextFeatures() {
    this.openSnackbar('Esta funcionalidad está en desarrollo.');
  }

  openSnackbar(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  ngOnDestroy() {
    this.globalStates.clearSelectedOwners();
  }
}
