export interface BulkUploadBadgeConfig {
  text: string;
  icon: string;
  gradient?: string;
}

export interface BulkUploadBankCardConfig {
  tag: string;
  icon: string;
  label: string;
}

export interface BulkUploadSummaryMetrics {
  totalRegistros: number;
  registrosValidados: number;
  registrosPendientes: number;
  montoPendiente: string;
  porcentajeConciliado: number;
  debitos: string;
  creditos: string;
  totalBanco: string;
  comision?: string;
  inscripcion?: string;
  multas?: string;
  panapass?: string;
  siniestros?: string;
  netoRecaudable?: string;
}
