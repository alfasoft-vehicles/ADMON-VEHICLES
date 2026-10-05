import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { BulkUploadStrategy } from './bulk-upload.strategy';
import { BulkUploadRecord } from '../models/bulk-upload-record.interface';
import {
  BulkUploadBadgeConfig,
  BulkUploadBankCardConfig,
  BulkUploadSummaryMetrics,
} from '../models/bulk-upload-config.interface';

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

  readonly uploadEndpoint = 'cash_register/bulk_upload/yappy';

  uploadFile(
    file: File | null,
  ): Observable<{ success: boolean; message?: string }> {
    // Simulación de carga hacia el endpoint de Yappy (preparado para HTTP client)
    return of({
      success: true,
      message: file
        ? `Archivo "${file.name}" cargado exitosamente en Yappy.`
        : 'Lote de Yappy preparado correctamente.',
    }).pipe(delay(350));
  }

  getRecords(): BulkUploadRecord[] {
    return [
      {
        id: 1,
        fecha: '2026-09-17',
        hora: '23:57:09',
        nombre: 'Luis Moreno',
        celular: '50765225610',
        comentario: 'Luis moreno',
        credito: '33.50',
        comision: '0.50',
        inscripcion: '0.00',
        multas: '0.00',
        panapass: '0.00',
        siniestros: '0.00',
        cedula: '8764853',
        codigo: '10396',
        unidad: 'FG67',
        otraUnd: '',
        estado: 'Activos',
        identifica: 'Fg67',
        pendiente: '0.00',
        hasAlert: false,
      },
      {
        id: 2,
        fecha: '2026-09-17',
        hora: '23:52:26',
        nombre: 'Bernardo Abrego',
        celular: '50767770575',
        comentario: '8-917-1771',
        credito: '36.00',
        comision: '0.50',
        inscripcion: '0.00',
        multas: '0.00',
        panapass: '0.00',
        siniestros: '0.00',
        cedula: '89171771',
        codigo: '10694',
        unidad: 'FA35',
        otraUnd: '',
        estado: 'Activos',
        identifica: 'Fa35',
        pendiente: '0.00',
        hasAlert: false,
      },
      {
        id: 3,
        fecha: '2026-09-17',
        hora: '23:51:04',
        nombre: 'Demetrio Sanjur',
        celular: '50763626271',
        comentario: 'Demetrio sanjur 4 217 440',
        credito: '34.50',
        comision: '0.50',
        inscripcion: '0.00',
        multas: '0.00',
        panapass: '0.00',
        siniestros: '0.00',
        cedula: '4217440',
        codigo: '10414',
        unidad: 'FG73',
        otraUnd: '',
        estado: 'Activos',
        identifica: 'Fg773',
        pendiente: '0.00',
        hasAlert: false,
      },
      {
        id: 4,
        fecha: '2026-09-17',
        hora: '23:48:11',
        nombre: 'Stephany Saldaña',
        celular: '50767675459',
        comentario: '8-875-2451',
        credito: '36.00',
        comision: '0.50',
        inscripcion: '0.00',
        multas: '0.00',
        panapass: '0.00',
        siniestros: '0.00',
        cedula: '88752451',
        codigo: '10055',
        unidad: 'AS51',
        otraUnd: '',
        estado: 'Activos',
        identifica: 'as51',
        pendiente: '0.00',
        hasAlert: false,
      },
      {
        id: 5,
        fecha: '2026-09-17',
        hora: '23:37:29',
        nombre: 'Juan Abrego',
        celular: '50765410308',
        comentario: '',
        credito: '35.00',
        comision: '0.50',
        inscripcion: '0.00',
        multas: '0.00',
        panapass: '0.00',
        siniestros: '0.00',
        cedula: '8-749-2294',
        codigo: '11039',
        unidad: 'ASM40',
        otraUnd: '',
        estado: 'Activos',
        identifica: 'asm40',
        pendiente: '0.00',
        hasAlert: false,
      },
      {
        id: 6,
        fecha: '2026-09-17',
        hora: '23:33:07',
        nombre: 'Yorlenis Guillen',
        celular: '50765071378',
        comentario: '4788547',
        credito: '39.00',
        comision: '0.50',
        inscripcion: '0.00',
        multas: '0.00',
        panapass: '0.00',
        siniestros: '0.00',
        cedula: '4788547',
        codigo: '10007',
        unidad: 'FA17',
        otraUnd: '',
        estado: 'Activos',
        identifica: 'fa17',
        pendiente: '0.00',
        hasAlert: false,
      },
      {
        id: 7,
        fecha: '2026-09-17',
        hora: '23:31:48',
        nombre: 'Elvis Macias',
        celular: '50765155557',
        comentario: 'Miercoles',
        credito: '29.75',
        comision: '0.50',
        inscripcion: '0.00',
        multas: '0.00',
        panapass: '0.00',
        siniestros: '0.00',
        cedula: '8933813',
        codigo: '10671',
        unidad: '0314',
        otraUnd: '',
        estado: 'Activos',
        identifica: '314',
        pendiente: '0.00',
        hasAlert: false,
      },
      {
        id: 8,
        fecha: '2026-09-17',
        hora: '23:29:54',
        nombre: 'Rebeca Sanjur',
        celular: '50767063190',
        comentario: 'Cuotadeldia16/9',
        credito: '36.00',
        comision: '0.50',
        inscripcion: '0.00',
        multas: '0.00',
        panapass: '0.00',
        siniestros: '0.00',
        cedula: '',
        codigo: '',
        unidad: '',
        otraUnd: '',
        estado: '',
        identifica: '373',
        pendiente: '5.00',
        hasAlert: true,
      },
      {
        id: 9,
        fecha: '2026-09-17',
        hora: '23:29:40',
        nombre: 'Alexis Quintero',
        celular: '50766994774',
        comentario: 'Alexis Quintero 4-226-267',
        credito: '36.00',
        comision: '0.50',
        inscripcion: '0.00',
        multas: '0.00',
        panapass: '0.00',
        siniestros: '0.00',
        cedula: '4226267',
        codigo: '10533',
        unidad: 'ASM62',
        otraUnd: '',
        estado: 'Activos',
        identifica: 'asm62',
        pendiente: '0.00',
        hasAlert: false,
      },
      {
        id: 10,
        fecha: '2026-09-17',
        hora: '23:28:42',
        nombre: 'Edgardo Mena',
        celular: '50764796540',
        comentario: '2 - 762 - 302',
        credito: '44.00',
        comision: '0.50',
        inscripcion: '0.00',
        multas: '0.00',
        panapass: '0.00',
        siniestros: '0.00',
        cedula: '2762302',
        codigo: '10491',
        unidad: 'MA35',
        otraUnd: '',
        estado: 'Activos',
        identifica: 'ma35',
        pendiente: '0.00',
        hasAlert: false,
      },
      {
        id: 11,
        fecha: '2026-09-17',
        hora: '23:27:36',
        nombre: 'Eleazar Guardado',
        celular: '50767259504',
        comentario: 'Eleazar Guardado',
        credito: '39.50',
        comision: '0.50',
        inscripcion: '0.00',
        multas: '0.00',
        panapass: '0.00',
        siniestros: '0.00',
        cedula: '87012331',
        codigo: '10618',
        unidad: 'AR497',
        otraUnd: '',
        estado: 'Bacupk',
        identifica: 'AR497',
        pendiente: '0.00',
        hasAlert: false,
      },
      {
        id: 12,
        fecha: '2026-09-17',
        hora: '23:25:45',
        nombre: 'Roberto Carrasquilla',
        celular: '50762881347',
        comentario: '8-864-1877',
        credito: '30.00',
        comision: '0.50',
        inscripcion: '0.00',
        multas: '0.00',
        panapass: '0.00',
        siniestros: '0.00',
        cedula: '8-864-1877',
        codigo: '10959',
        unidad: 'SH27',
        otraUnd: '',
        estado: 'Activos',
        identifica: 'sh27',
        pendiente: '0.00',
        hasAlert: false,
      },
      {
        id: 13,
        fecha: '2026-09-17',
        hora: '23:21:11',
        nombre: 'Robert Asyn',
        celular: '50768872914',
        comentario: '8-781-2125',
        credito: '36.00',
        comision: '0.50',
        inscripcion: '0.00',
        multas: '0.00',
        panapass: '0.00',
        siniestros: '0.00',
        cedula: '87812125',
        codigo: '9585',
        unidad: 'LA282',
        otraUnd: '',
        estado: 'Activos',
        identifica: 'la282',
        pendiente: '0.00',
        hasAlert: false,
      },
      {
        id: 14,
        fecha: '2026-09-17',
        hora: '23:20:26',
        nombre: 'Adrian Murillo',
        celular: '50760675859',
        comentario: '',
        credito: '36.00',
        comision: '0.50',
        inscripcion: '0.00',
        multas: '0.00',
        panapass: '0.00',
        siniestros: '0.00',
        cedula: '8798967',
        codigo: '10741',
        unidad: 'UBT1091',
        otraUnd: '',
        estado: 'Activos',
        identifica: '1091',
        pendiente: '0.00',
        hasAlert: false,
      },
      {
        id: 15,
        fecha: '2026-09-17',
        hora: '23:18:19',
        nombre: 'Eyuzkia De La Cruz',
        celular: '50764984356',
        comentario: 'Manuel Barría',
        credito: '37.00',
        comision: '0.50',
        inscripcion: '0.00',
        multas: '0.00',
        panapass: '0.00',
        siniestros: '0.00',
        cedula: '',
        codigo: '',
        unidad: '',
        otraUnd: '',
        estado: '',
        identifica: '334',
        pendiente: '5.00',
        hasAlert: true,
      },
      {
        id: 16,
        fecha: '2026-09-17',
        hora: '23:17:58',
        nombre: 'Juan Castillo',
        celular: '50762569113',
        comentario: 'Pago 16 de septiembre de Juan Castillo',
        credito: '19.50',
        comision: '0.50',
        inscripcion: '0.00',
        multas: '0.00',
        panapass: '0.00',
        siniestros: '0.00',
        cedula: '8-527-2494',
        codigo: '10994',
        unidad: '0426',
        otraUnd: '',
        estado: 'Activos',
        identifica: '426',
        pendiente: '0.00',
        hasAlert: false,
      },
    ];
  }

  getSummaryMetrics(): BulkUploadSummaryMetrics {
    return {
      totalRegistros: 222,
      registrosValidados: 220,
      registrosPendientes: 2,
      montoPendiente: '10.00',
      porcentajeConciliado: 99.1,
      debitos: '0.00',
      creditos: '8,349.75',
      totalBanco: '8,590.25',
      comision: '111.00',
      inscripcion: '100.00',
      multas: '0.00',
      panapass: '0.00',
      siniestros: '29.50',
      netoRecaudable: '8,238.75',
    };
  }

  isRecordInReview(record: BulkUploadRecord): boolean {
    return !!record.hasAlert || !record.unidad;
  }

  isRecordReady(record: BulkUploadRecord): boolean {
    return !this.isRecordInReview(record);
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
