import { Observable } from 'rxjs';
import { BulkUploadRecord } from '../models/bulk-upload-record.interface';
import {
  BulkUploadBadgeConfig,
  BulkUploadBankCardConfig,
  BulkUploadSummaryMetrics,
} from '../models/bulk-upload-config.interface';

export interface BulkUploadStrategy {
  /** Identificador único del tipo de carga (ej. 'yappy', 'ach', 'banco-general') */
  readonly type: string;

  /** Título principal para la cabecera */
  readonly title: string;

  /** Configuración de la insignia / badge (icono, texto, estilo) */
  readonly badgeConfig: BulkUploadBadgeConfig;

  /** Configuración de la card bancaria en el dashboard inferior */
  readonly bankCardConfig: BulkUploadBankCardConfig;

  /** Endpoint para la carga masiva (cuando esté disponible en backend) */
  readonly uploadEndpoint: string;

  /** Sube el archivo correspondiente a este tipo de carga (mock o HTTP) */
  uploadFile(
    file: File | null,
  ): Observable<{ success: boolean; message?: string }>;

  /** Obtiene la lista de registros cargados */
  getRecords(): BulkUploadRecord[];

  /** Obtiene las métricas de resumen y conciliación */
  getSummaryMetrics(): BulkUploadSummaryMetrics;

  /** Determina si un registro requiere revisión */
  isRecordInReview(record: BulkUploadRecord): boolean;

  /** Determina si un registro está listo / validado */
  isRecordReady(record: BulkUploadRecord): boolean;

  /** Ordena los registros según el criterio especificado */
  sortRecords(
    records: BulkUploadRecord[],
    order: 'default' | 'revision' | 'ready',
  ): BulkUploadRecord[];
}
