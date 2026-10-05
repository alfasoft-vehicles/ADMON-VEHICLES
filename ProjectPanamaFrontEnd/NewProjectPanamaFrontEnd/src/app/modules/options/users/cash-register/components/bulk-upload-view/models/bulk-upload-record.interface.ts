export interface BulkUploadRecord {
  id: number;
  fecha: string;
  hora: string;
  nombre: string;
  celular?: string;
  comentario?: string;
  credito: string;
  comision?: string;
  inscripcion?: string;
  multas?: string;
  panapass?: string;
  siniestros?: string;
  cedula?: string;
  codigo?: string;
  unidad?: string;
  otraUnd?: string;
  estado?: string;
  identifica?: string;
  pendiente: string;
  hasAlert?: boolean;
  [key: string]: any;
}
