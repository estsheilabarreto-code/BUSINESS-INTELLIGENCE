import {
  GeminiSecondOpinionResponse,
  KpiMetrics,
  Finding,
  FilterState,
  LaborRecord,
} from '../types/data';

export interface SecondOpinionContext {
  selectedYear: string;
  selectedSector: string;
  indicatorType: string;
  metrics: KpiMetrics;
  currentFindings: Finding[];
  topSectors: Array<{ sector: string; accidentes: number; tasa: number; afiliados: number }>;
}

export async function requestSecondOpinion(
  filters: FilterState,
  metrics: KpiMetrics,
  findings: Finding[],
  records: LaborRecord[]
): Promise<GeminiSecondOpinionResponse> {
  // Extraer los top 5 sectores del contexto para darle sustento cuantitativo directo
  const targetYear = typeof metrics.currentYear === 'number' ? metrics.currentYear : 2025;
  const topSectors = records
    .filter((r) => r.year === targetYear && !r.isTotalGeneral)
    .sort((a, b) => b.accidentesCalificados - a.accidentesCalificados)
    .slice(0, 5)
    .map((s) => ({
      sector: s.sector,
      accidentes: s.accidentesCalificados,
      tasa: Number(s.tasaAccidentalidad.toFixed(2)),
      afiliados: s.totalAfiliados,
    }));

  const payload: SecondOpinionContext = {
    selectedYear: filters.selectedYear,
    selectedSector: filters.selectedSector,
    indicatorType: filters.indicatorType,
    metrics,
    currentFindings: findings,
    topSectors,
  };

  const response = await fetch('/api/gemini/second-opinion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ context: payload }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Error ${response.status}: No se pudo obtener la segunda opinión de Gemini.`
    );
  }

  const data = await response.json();
  if (!data.success || !data.opinion) {
    throw new Error(data.error || 'Respuesta incompleta del servicio de análisis Gemini.');
  }

  return data.opinion;
}
