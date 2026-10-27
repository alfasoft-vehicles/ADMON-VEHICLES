import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { BulkUploadStrategy } from '../strategies/bulk-upload.strategy';
import { BulkUploadStrategyFactory } from '../strategies/bulk-upload-strategy.factory';
import { BulkUploadRecord } from '../models/bulk-upload-record.interface';
import { BulkUploadSummaryMetrics } from '../models/bulk-upload-config.interface';

@Injectable({
  providedIn: 'root',
})
export class BulkUploadService {
  private activeStrategySubject =
    new BehaviorSubject<BulkUploadStrategy | null>(null);
  public activeStrategy$: Observable<BulkUploadStrategy | null> =
    this.activeStrategySubject.asObservable();

  constructor(private strategyFactory: BulkUploadStrategyFactory) {}

  /**
   * Carga y establece la estrategia activa según el parámetro :type de la ruta.
   */
  setStrategyByType(type?: string | null): BulkUploadStrategy {
    const strategy = this.strategyFactory.getStrategy(type);
    this.activeStrategySubject.next(strategy);
    return strategy;
  }

  /**
   * Valida si existe una estrategia registrada para el tipo dado.
   */
  hasStrategy(type?: string | null): boolean {
    if (!type) {
      return false;
    }
    return this.strategyFactory.hasStrategy(type);
  }

  /**
   * Obtiene la estrategia actual seleccionada
   */
  getActiveStrategy(): BulkUploadStrategy {
    const current = this.activeStrategySubject.value;
    return current || this.strategyFactory.getStrategy();
  }

  /**
   * Consulta si existen registros disponibles en la base de datos para la estrategia.
   */
  hasRecords(type?: string | null): Observable<boolean> {
    const strategy = this.strategyFactory.getStrategy(type);
    if (strategy.hasRecords) {
      return strategy.hasRecords();
    }
    return of(false);
  }

  /**
   * Sube el archivo delegando a la estrategia correspondiente según el tipo.
   */
  uploadFile(
    type: string,
    file: File | null,
  ): Observable<{ success: boolean; message?: string; data?: any }> {
    const strategy = this.strategyFactory.getStrategy(type);
    return strategy.uploadFile(file);
  }

  /**
   * Obtiene los registros para la estrategia actual desde el backend.
   */
  getRecords(): Observable<BulkUploadRecord[]> {
    return this.getActiveStrategy().getRecords();
  }

  /**
   * Obtiene los totales de conciliación para la estrategia actual desde el backend.
   */
  getTotals(): Observable<any> {
    const strategy = this.getActiveStrategy();
    if (strategy && strategy.getTotals) {
      return strategy.getTotals();
    }
    return of(null);
  }

  /**
   * Obtiene las métricas para la estrategia actual a partir de los registros y/o totales provistos.
   */
  getSummaryMetrics(
    records?: BulkUploadRecord[],
    backendTotals?: any,
  ): BulkUploadSummaryMetrics {
    return this.getActiveStrategy().getSummaryMetrics(records, backendTotals);
  }

  /**
   * Ordena los registros delegando a la estrategia activa.
   */
  sortRecords(
    records: BulkUploadRecord[],
    order: 'default' | 'revision' | 'ready',
  ): BulkUploadRecord[] {
    return this.getActiveStrategy().sortRecords(records, order);
  }

  /**
   * Valida si un registro requiere revisión según la estrategia activa.
   */
  isRecordInReview(record: BulkUploadRecord): boolean {
    return this.getActiveStrategy().isRecordInReview(record);
  }

  /**
   * Valida si un registro está listo según la estrategia activa.
   */
  isRecordReady(record: BulkUploadRecord): boolean {
    return this.getActiveStrategy().isRecordReady(record);
  }

  /**
   * Asigna una unidad vehicular a un registro mediante la estrategia activa.
   */
  assignVehicle(reference: string, vehicleNumber: string): Observable<any> {
    const strategy = this.getActiveStrategy();
    if (strategy && strategy.assignVehicle) {
      return strategy.assignVehicle(reference, vehicleNumber);
    }
    return throwError(
      () =>
        new Error(
          'La estrategia activa no soporta la asignación de unidad vehicular.',
        ),
    );
  }
}
