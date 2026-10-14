import { Injectable } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { BulkUploadStrategy } from './bulk-upload.strategy';
import { BulkUploadRecord } from '../models/bulk-upload-record.interface';
import {
  BulkUploadBadgeConfig,
  BulkUploadBankCardConfig,
  BulkUploadSummaryMetrics,
} from '../models/bulk-upload-config.interface';
import { ApiService } from 'src/app/services/api.service';
import { JwtService } from 'src/app/services/jwt.service';

@Injectable({
  providedIn: 'root',
})
export class YappyBulkUploadStrategy implements BulkUploadStrategy {
  readonly type = 'yappy';
  readonly title = 'Carga Masiva';

  readonly badgeConfig: BulkUploadBadgeConfig = {
    text: 'YAPPY',
    icon: 'payments',
    gradient: 'linear-gradient(135deg, #0077c8 0%, #00a4e4 100%)',
  };

  readonly bankCardConfig: BulkUploadBankCardConfig = {
    tag: 'BANCO GENERAL',
    icon: 'account_balance',
    label: 'T. BANCO',
  };

  readonly uploadEndpoint = 'wallet/bulk-upload/yappy';

  constructor(
    private apiService: ApiService,
    private jwtService: JwtService,
  ) {}

  uploadFile(
    file: File | null,
  ): Observable<{ success: boolean; message?: string; data?: any }> {
    if (!file) {
      return throwError(
        () => new Error('Debe seleccionar un archivo .CSV válido.'),
      );
    }

    const userData = this.jwtService.getUserData();
    const companyCode = (userData?.empresa || '10').trim();

    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.apiService
      .postData(`wallet/bulk-upload/yappy/${companyCode}`, formData)
      .pipe(
        map((res: any) => {
          const message =
            res?.message || 'Carga de CSV procesada exitosamente.';
          const stats = [];
          if (res?.inserted !== undefined) {
            stats.push(`${res.inserted} insertados`);
          }
          if (res?.updated !== undefined) {
            stats.push(`${res.updated} actualizados`);
          }
          const details = stats.length > 0 ? ` (${stats.join(', ')})` : '';

          return {
            success: true,
            message: `${message}${details}`,
            data: res,
          };
        }),
      );
  }

  /**
   * Consulta al backend si existen registros de Yappy disponibles en la BD.
   * Endpoint: GET wallet/has-records/yappy/ -> { "has_records": 1 | 0 }
   */
  hasRecords(): Observable<boolean> {
    return this.apiService.getData('wallet/has-records/yappy').pipe(
      map((res: any) => Number(res?.has_records) === 1),
      catchError((error) => {
        console.error(
          '[YappyBulkUploadStrategy] Error al verificar registros existentes:',
          error,
        );
        return of(false);
      }),
    );
  }

  getRecords(): Observable<BulkUploadRecord[]> {
    const userData = this.jwtService.getUserData();
    const companyCode = (userData?.empresa || '10').trim();

    return this.apiService
      .getData(`wallet/get-records/yappy/${companyCode}`)
      .pipe(
        map((items: any[]) => {
          if (!Array.isArray(items)) {
            return [];
          }
          return items.map((item, index) => this.mapToRecord(item, index + 1));
        }),
      );
  }

  private mapToRecord(item: any, id: number): BulkUploadRecord {
    const isReview = Number(item.review) === 1;

    const creditoVal =
      item.CREDITO != null && !isNaN(Number(item.CREDITO))
        ? Number(item.CREDITO)
        : item.TOTAL != null && !isNaN(Number(item.TOTAL))
          ? Number(item.TOTAL)
          : 0;

    const comisionVal =
      item.COMISION != null && !isNaN(Number(item.COMISION))
        ? Number(item.COMISION)
        : 0;

    const debitoVal =
      item.DEBITO != null && !isNaN(Number(item.DEBITO))
        ? Number(item.DEBITO)
        : 0;

    const formatNum = (val: any) => {
      if (val === null || val === undefined || val === '') return '0.00';
      const n = Number(val);
      return isNaN(n) ? '0.00' : n.toFixed(2);
    };

    return {
      id,
      fecha: (item.FECHA || '').trim(),
      hora: (item.HORA || '').trim(),
      nombre: (item.NOMBRE || '').trim(),
      celular: (item.CELULAR || '').trim(),
      comentario: (item.COMENTARIO || '').trim(),
      credito: creditoVal.toFixed(2),
      debito: debitoVal.toFixed(2),
      comision: comisionVal.toFixed(2),
      inscripcion: formatNum(item.INSCRIPCIO),
      multas: formatNum(item.MULTA),
      panapass: formatNum(item.PANAPASS),
      siniestros: formatNum(item.SINIESTROS),
      cedula: (item.CEDULA || '').trim(),
      codigo: (item.CODIGO || '').trim(),
      unidad: (item.UNIDAD || (!isReview ? item.IDENTIFICA : '') || '').trim(),
      otraUnd: (item.UNIDAD2 || '').trim(),
      estado: (item.NOMESTADO || item.ESTADO || '').trim(),
      identifica: (item.IDENTIFICA || '').trim(),
      pendiente: isReview ? creditoVal.toFixed(2) : '0.00',
      hasAlert: isReview,
      review: isReview ? 1 : 0,
      referencia: (item.REFERENCIA || '').trim(),
      rawData: item,
    };
  }

  getSummaryMetrics(
    records: BulkUploadRecord[] = [],
  ): BulkUploadSummaryMetrics {
    const totalRegistros = records.length;
    const pendientes = records.filter((r) => this.isRecordInReview(r));
    const registrosPendientes = pendientes.length;
    const registrosValidados = totalRegistros - registrosPendientes;

    const montoPendienteNum = pendientes.reduce(
      (sum, r) => sum + (parseFloat(r.pendiente || '0') || 0),
      0,
    );

    const creditosNum = records.reduce(
      (sum, r) => sum + (parseFloat(r.credito || '0') || 0),
      0,
    );

    const debitosNum = records.reduce(
      (sum, r) => sum + (parseFloat(r.debito || '0') || 0),
      0,
    );

    const comisionNum = records.reduce(
      (sum, r) => sum + (parseFloat(r.comision || '0') || 0),
      0,
    );

    const inscripcionNum = records.reduce(
      (sum, r) => sum + (parseFloat(r.inscripcion || '0') || 0),
      0,
    );

    const multasNum = records.reduce(
      (sum, r) => sum + (parseFloat(r.multas || '0') || 0),
      0,
    );

    const panapassNum = records.reduce(
      (sum, r) => sum + (parseFloat(r.panapass || '0') || 0),
      0,
    );

    const siniestrosNum = records.reduce(
      (sum, r) => sum + (parseFloat(r.siniestros || '0') || 0),
      0,
    );

    const formatMoney = (val: number) =>
      val.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    return {
      totalRegistros,
      registrosValidados,
      registrosPendientes,
      montoPendiente: formatMoney(montoPendienteNum),
      porcentajeConciliado:
        totalRegistros > 0
          ? parseFloat(((registrosValidados / totalRegistros) * 100).toFixed(1))
          : 0,
      debitos: formatMoney(debitosNum),
      creditos: formatMoney(creditosNum),
      totalBanco: formatMoney(creditosNum),
      comision: formatMoney(comisionNum),
      inscripcion: formatMoney(inscripcionNum),
      multas: formatMoney(multasNum),
      panapass: formatMoney(panapassNum),
      siniestros: formatMoney(siniestrosNum),
      netoRecaudable: formatMoney(creditosNum - comisionNum),
    };
  }

  isRecordInReview(record: BulkUploadRecord): boolean {
    return Number(record.review) === 1;
  }

  isRecordReady(record: BulkUploadRecord): boolean {
    return Number(record.review) === 0;
  }

  sortRecords(
    records: BulkUploadRecord[],
    order: 'default' | 'revision' | 'ready',
  ): BulkUploadRecord[] {
    const list = [...records];
    if (order === 'revision') {
      return list.sort((a, b) => {
        const aNeeds = this.isRecordInReview(a) ? 1 : 0;
        const bNeeds = this.isRecordInReview(b) ? 1 : 0;
        if (bNeeds !== aNeeds) {
          return bNeeds - aNeeds;
        }
        return a.id - b.id;
      });
    } else if (order === 'ready') {
      return list.sort((a, b) => {
        const aReady = this.isRecordReady(a) ? 1 : 0;
        const bReady = this.isRecordReady(b) ? 1 : 0;
        if (bReady !== aReady) {
          return bReady - aReady;
        }
        return a.id - b.id;
      });
    } else {
      return list.sort((a, b) => a.id - b.id);
    }
  }
}
