import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
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
   * Obtiene los registros para la estrategia actual.
   * (Preparado para conectar con endpoints cuando estén disponibles)
   */
  getRecords(): BulkUploadRecord[] {
    return this.getActiveStrategy().getRecords();
  }

  /**
   * Obtiene las métricas para la estrategia actual.
   */
  getSummaryMetrics(): BulkUploadSummaryMetrics {
    return this.getActiveStrategy().getSummaryMetrics();
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
}
