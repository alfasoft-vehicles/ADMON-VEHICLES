import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { BulkUploadService } from './services/bulk-upload.service';
import { BulkUploadStrategy } from './strategies/bulk-upload.strategy';
import { BulkUploadRecord } from './models/bulk-upload-record.interface';
import { BulkUploadSummaryMetrics } from './models/bulk-upload-config.interface';

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
}
