import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { BulkUploadService } from './services/bulk-upload.service';
import { BulkUploadStrategy } from './strategies/bulk-upload.strategy';
import { BulkUploadRecord } from './models/bulk-upload-record.interface';
import { BulkUploadSummaryMetrics } from './models/bulk-upload-config.interface';
import { ConfirmActionDialogComponent } from 'src/app/modules/shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { SearchUnitDialogComponent } from './dialogs/search-unit-dialog/search-unit-dialog.component';

@Component({
  selector: 'app-bulk-upload-view',
  templateUrl: './bulk-upload-view.component.html',
  styleUrls: ['./bulk-upload-view.component.css'],
})
export class BulkUploadViewComponent implements OnInit, OnDestroy {
  // Estrategia activa según :type
  activeStrategy: BulkUploadStrategy | null = null;

  // Criterios de búsqueda
  filterCriteria: string = 'unidad';
  searchTerm: string = '';

  // Resumen / Métricas
  metrics: BulkUploadSummaryMetrics = {
    totalRegistros: 0,
    registrosValidados: 0,
    registrosPendientes: 0,
    montoPendiente: '0.00',
    porcentajeConciliado: 0,
    debitos: '0.00',
    creditos: '0.00',
    totalBanco: '0.00',
    comision: '0.00',
    inscripcion: '0.00',
    multas: '0.00',
    panapass: '0.00',
    siniestros: '0.00',
    netoRecaudable: '0.00',
  };

  // Fila seleccionada actualmente
  selectedRowId: number | null = null;

  // Lista de registros cargados
  records: BulkUploadRecord[] = [];

  // Criterio de ordenamiento
  sortOrder: 'default' | 'revision' | 'ready' = 'default';

  private routeSub!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bulkUploadService: BulkUploadService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe((params) => {
      const type = params.get('type');
      if (!type || !this.bulkUploadService.hasStrategy(type)) {
        this.snackBar.open(
          'Por favor, seleccione un banco o pasarela para continuar con la carga masiva',
          'Entendido',
          {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          },
        );
        this.router.navigate(['/cash-register']);
        return;
      }
      this.initStrategy(type);
    });
  }

  ngOnDestroy(): void {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }

  /**
   * Inicializa la vista con la estrategia correspondiente al tipo
   */
  private initStrategy(type?: string | null): void {
    this.activeStrategy = this.bulkUploadService.setStrategyByType(type);
    this.records = this.bulkUploadService.getRecords();
    this.metrics = this.bulkUploadService.getSummaryMetrics();
    this.applySort();
  }

  selectRow(id: number): void {
    this.selectedRowId = this.selectedRowId === id ? null : id;
  }

  clearSearch(): void {
    this.searchTerm = '';
  }

  onSortChange(value: 'default' | 'revision' | 'ready'): void {
    this.sortOrder = value || 'default';
    this.applySort();
  }

  applySort(): void {
    this.records = this.bulkUploadService.sortRecords(
      this.records,
      this.sortOrder,
    );
  }

  isRecordInReview(record: BulkUploadRecord): boolean {
    return this.bulkUploadService.isRecordInReview(record);
  }

  isRecordReady(record: BulkUploadRecord): boolean {
    return this.bulkUploadService.isRecordReady(record);
  }

  confirmRecaudo(): void {
    const pendingRecords = this.records.filter((r) => this.isRecordInReview(r));
    const pendingCount = pendingRecords.length;
    const validCount = this.records.length - pendingCount;

    let dialogMessage: string;

    if (pendingCount === 0) {
      dialogMessage = `Todos los registros se encuentran validados correctamente. ¿Está seguro de procesar el recaudo total del lote por un monto de $${this.metrics.creditos}?`;
    } else {
      dialogMessage = `Se encontraron ${pendingCount} registro(s) que requieren revisión. Solo se recaudarán los ${validCount} registros válidos y los pendientes se dejarán sin procesar para su posterior verificación. ¿Desea continuar con el recaudo?`;
    }

    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '480px',
      maxWidth: '92vw',
      data: {
        documentName: 'Confirmar Recaudo de Carga Masiva',
        message: dialogMessage,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.snackBar.open(
          `Recaudo procesado exitosamente (${validCount} registros conciliados).`,
          'Entendido',
          {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          },
        );
      } else {
        this.snackBar.open('No se han realizado recaudos', 'Entendido', {
          duration: 3500,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });
      }
    });
  }

  openSearchUnitDialog(record: BulkUploadRecord): void {
    const dialogRef = this.dialog.open(SearchUnitDialogComponent, {
      width: '740px',
      maxWidth: '94vw',
      panelClass: 'custom-dialog-container',
      disableClose: true,
      data: { record },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.confirmed && result.updatedData) {
        this.updateRecordAssignment(record.id, result.updatedData);
      }
    });
  }

  updateRecordAssignment(
    recordId: number,
    updatedData: Partial<BulkUploadRecord>,
  ): void {
    const index = this.records.findIndex((r) => r.id === recordId);
    if (index !== -1) {
      this.records[index] = { ...this.records[index], ...updatedData };
      this.recalculateMetrics();
      this.applySort();
    }
  }

  recalculateMetrics(): void {
    const pendientes = this.records.filter((r) => this.isRecordInReview(r));
    const pendientesCount = pendientes.length;
    const validadosCount = this.records.length - pendientesCount;

    const montoPendienteNum = pendientes.reduce(
      (sum, r) => sum + (parseFloat(r.pendiente) || 0),
      0,
    );

    this.metrics.registrosPendientes = pendientesCount;
    this.metrics.registrosValidados = validadosCount;
    this.metrics.montoPendiente = montoPendienteNum.toFixed(2);
    this.metrics.porcentajeConciliado =
      this.records.length > 0
        ? parseFloat(((validadosCount / this.records.length) * 100).toFixed(1))
        : 0;
  }
}
