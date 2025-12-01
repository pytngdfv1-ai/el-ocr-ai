export interface DocumentMetadata {
  fecha: string | null;
  remitente: string;
  destinatario: string;
  tipoDocumento: string;
  etiquetas: string[];
  resumen: string;
}

export interface QnaItem {
  question: string;
  answer: string;
  type: 'internal' | 'web';
  sources?: { web: { uri: string; title: string } }[];
}


export interface Document {
  id: string;
  nombreArchivo: string;
  imagenUrl: string;
  textoOCR: string;
  metadata: DocumentMetadata;
  qnaHistory?: QnaItem[];
}