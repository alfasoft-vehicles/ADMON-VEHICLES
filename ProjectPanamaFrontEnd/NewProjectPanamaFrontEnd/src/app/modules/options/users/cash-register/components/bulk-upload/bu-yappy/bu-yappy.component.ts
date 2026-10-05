import { Component } from '@angular/core';

export interface YappyRecord {
  id: number;
  fecha: string;
  hora: string;
  nombre: string;
  celular: string;
  comentario: string;
  credito: string;
  comision: string;
  inscripcion: string;
  multas: string;
  panapass: string;
  siniestros: string;
  cedula: string;
  codigo: string;
  unidad: string;
  otraUnd: string;
  estado: string;
  identifica: string;
  pendiente: string;
  hasAlert?: boolean;
}

@Component({
  selector: 'app-bu-yappy',
  templateUrl: './bu-yappy.component.html',
  styleUrls: ['./bu-yappy.component.css'],
})
export class BuYappyComponent {
  // Criterios de búsqueda
  filterCriteria: string = 'unidad';
  searchTerm: string = '';

  // Resumen / Totales
  totalRegistros: number = 222;
  debitos: string = '0.00';
  creditos: string = '8,349.75';
  comision: string = '111.00';
  inscripcion: string = '100.00';
  multas: string = '0.00';
  panapass: string = '0.00';
  siniestros: string = '29.50';
  totalBanco: string = '8,590.25';

  // Métricas de Auditoría y Control
  registrosValidados: number = 220;
  registrosPendientes: number = 2;
  montoPendiente: string = '10.00';
  porcentajeConciliado: number = 99.1;
  netoRecaudable: string = '8,238.75';

  // Fila seleccionada actualmente (por defecto ninguna seleccionada)
  selectedRowId: number | null = null;

  // Lista de registros de muestra (Fieles a la imagen de referencia)
  records: YappyRecord[] = [
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

  // Criterio de ordenamiento: 'default' | 'revision' | 'ready'
  sortOrder: 'default' | 'revision' | 'ready' = 'default';

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
    if (this.sortOrder === 'revision') {
      // Priorizar los registros que requieren revisión (hasAlert || !unidad)
      this.records.sort((a, b) => {
        const aNeedsReview = a.hasAlert || !a.unidad ? 1 : 0;
        const bNeedsReview = b.hasAlert || !b.unidad ? 1 : 0;
        if (bNeedsReview !== aNeedsReview) {
          return bNeedsReview - aNeedsReview;
        }
        return a.id - b.id;
      });
    } else if (this.sortOrder === 'ready') {
      // Priorizar los registros listos / asignados (!hasAlert && unidad)
      this.records.sort((a, b) => {
        const aReady = !a.hasAlert && a.unidad ? 1 : 0;
        const bReady = !b.hasAlert && b.unidad ? 1 : 0;
        if (bReady !== aReady) {
          return bReady - aReady;
        }
        return a.id - b.id;
      });
    } else {
      // Orden por defecto: id ascendente
      this.records.sort((a, b) => a.id - b.id);
    }
  }
}
