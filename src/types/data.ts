export interface RawLaborRecord {
  Año?: string;
  Ano?: string;
  'Sector Económico'?: string;
  'Sector Economico'?: string;
  'Trabajadores afiliados dependientes'?: string;
  'Estudiantes'?: string;
  'Trabajadores afiliados independientes'?: string;
  'Accidentes de trabajo calificados'?: string;
  'Enfermedades calificadas como laborales'?: string;
  'Muertes reportadas por accidentes de trabajo calificadas como Laboral'?: string;
  'Muertes reportadas por accidentes de trabajo calificadas como L'?: string;
  'Muertes por enfermedad laboral calificadas'?: string;
  'Tasa de accidentalidad'?: string;
  'Tasa de mortalidad por accidente de trabajo y enfermedad laboral -ATEL-'?: string;
  'Tasa de mortalidad por accidente de trabajo y enfermedad labora'?: string;
  'Tasa de enfermedad laboral -ATEL-'?: string;
  [key: string]: any;
}

export interface LaborRecord {
  id: string;
  year: number;
  sector: string;
  rawSector: string;
  isTotalGeneral: boolean;
  afiliadosDependientes: number;
  estudiantes: number;
  afiliadosIndependientes: number;
  totalAfiliados: number;
  accidentesCalificados: number;
  enfermedadesCalificadas: number;
  muertesAccidentes: number;
  muertesEnfermedad: number;
  totalMuertes: number;
  tasaAccidentalidad: number;
  tasaMortalidad: number;
  tasaEnfermedad: number;
}

export interface ResourceMetadata {
  id: string;
  name: string;
  url: string;
  lastModified: string;
  format: string;
  datastoreActive: boolean;
  totalRecordsInDatastore?: number;
  totalRecordsInCsv?: number;
  datasetId: string;
  sourceUrl: string;
  fetchedAt: string;
  sourceType: 'API_UNIFIED' | 'DIRECT_CSV' | 'DATASTORE';
}

export interface FilterState {
  selectedYear: string; // 'ALL' or '2025', '2024', etc.
  selectedSector: string; // 'ALL', 'TOTAL_GENERAL', or specific sector
  indicatorType: 'ALL' | 'ACCIDENTALIDAD' | 'MORTALIDAD' | 'ENFERMEDAD';
  searchTerm: string;
}

export interface VariationResult {
  pct: number | null;
  label: string;
  isCalculable: boolean;
  trend: 'up' | 'down' | 'neutral' | 'na';
}

export interface KpiMetrics {
  currentYear: number | string;
  previousYear: number | null;
  
  // Accidentalidad
  tasaAccidentalidad: number;
  tasaAccidentalidadPrev: number | null;
  tasaAccidentalidadVar: VariationResult;
  totalAccidentes: number;
  totalAccidentesPrev: number | null;
  totalAccidentesVar: VariationResult;

  // Mortalidad
  muertesAccidentes: number;
  muertesEnfermedad: number;
  totalMuertes: number;
  totalMuertesPrev: number | null;
  totalMuertesVar: VariationResult;
  tasaMortalidad: number;
  tasaMortalidadPrev: number | null;
  tasaMortalidadVar: VariationResult;

  // Enfermedad Laboral
  totalEnfermedades: number;
  totalEnfermedadesPrev: number | null;
  totalEnfermedadesVar: VariationResult;
  tasaEnfermedad: number;
  tasaEnfermedadPrev: number | null;
  tasaEnfermedadVar: VariationResult;

  // Población trabajadora
  totalAfiliados: number;
  afiliadosDependientes: number;
  afiliadosIndependientes: number;
  estudiantes: number;
  totalAfiliadosVar: VariationResult;
}

export interface Finding {
  id: string;
  type: 'ALERTA' | 'FAVORABLE' | 'OBSERVACION' | 'ESTRUCTURAL';
  category: 'Accidentalidad' | 'Mortalidad' | 'Enfermedad Laboral' | 'Cobertura';
  title: string;
  description: string;
  dataPoint: string;
  criterion: string;
  recommendation: string;
}

export interface GeminiSecondOpinionResponse {
  hallazgoIdentificado: string;
  accionPropuesta: string;
  datosQueRespaldan: string[];
  justificacion: string;
  resultadoEsperado: string;
  limitaciones: string;
  metadata?: {
    analyzedYear: string;
    analyzedSector: string;
    timestamp: string;
  };
}
