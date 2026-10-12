import {
  LaborRecord,
  RawLaborRecord,
  VariationResult,
  KpiMetrics,
  Finding,
} from '../types/data';

/**
 * Parsea un entero con separadores de miles de Colombia (puntos)
 * Ej: "2.895.796" -> 2895796
 */
export function parseColombianInteger(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return Math.round(val);
  const str = String(val).trim();
  if (!str || str === '-' || str === 'N/A' || str === 'NA' || str === 'null') return 0;

  // Si tiene coma, tomar parte entera previa
  const beforeComma = str.split(',')[0];
  const cleaned = beforeComma.replace(/\./g, '').trim();
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Parsea un decimal con coma decimal de Colombia
 * Ej: "6,1" -> 6.1 o "3,099679287" -> 3.099679287
 */
export function parseColombianDecimal(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).trim();
  if (!str || str === '-' || str === 'N/A' || str === 'NA' || str === 'null') return 0;

  // Si tiene coma, reemplazarla por punto decimal
  if (str.includes(',')) {
    const cleaned = str.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  // Si no tiene coma pero tiene punto:
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Normaliza nombres de sectores económicos para consistencia visual
 */
export function normalizeSectorName(raw: string): string {
  if (!raw) return 'Sin especificar';
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();

  if (lower === 'total general') {
    return 'Total general';
  }

  // Si viene en MAYÚSCULAS COMPLETAS (como en los registros de 2025), convertir a formato tipo oración con mayúscula inicial
  if (trimmed === trimmed.toUpperCase() && trimmed.length > 3) {
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  }

  return trimmed;
}

/**
 * Transforma un registro crudo a un objeto fuertemente tipado
 */
export function transformRawRecord(raw: RawLaborRecord, index: number): LaborRecord {
  const yearStr = raw['Año'] || raw['Ano'] || '0';
  const year = parseInt(yearStr, 10) || 0;

  const rawSector = raw['Sector Económico'] || raw['Sector Economico'] || '';
  const sector = normalizeSectorName(rawSector);
  const isTotalGeneral = sector.toLowerCase() === 'total general';

  const afiliadosDependientes = parseColombianInteger(raw['Trabajadores afiliados dependientes']);
  const estudiantes = parseColombianInteger(raw['Estudiantes']);
  const afiliadosIndependientes = parseColombianInteger(raw['Trabajadores afiliados independientes']);
  const totalAfiliados = afiliadosDependientes + afiliadosIndependientes + estudiantes;

  const accidentesCalificados = parseColombianInteger(raw['Accidentes de trabajo calificados']);
  const enfermedadesCalificadas = parseColombianInteger(raw['Enfermedades calificadas como laborales']);

  const muertesAccidentes = parseColombianInteger(
    raw['Muertes reportadas por accidentes de trabajo calificadas como Laboral'] ||
    raw['Muertes reportadas por accidentes de trabajo calificadas como L']
  );
  const muertesEnfermedad = parseColombianInteger(raw['Muertes por enfermedad laboral calificadas']);
  const totalMuertes = muertesAccidentes + muertesEnfermedad;

  const tasaAccidentalidad = parseColombianDecimal(raw['Tasa de accidentalidad']);
  const tasaMortalidad = parseColombianDecimal(
    raw['Tasa de mortalidad por accidente de trabajo y enfermedad laboral -ATEL-'] ||
    raw['Tasa de mortalidad por accidente de trabajo y enfermedad labora']
  );
  const tasaEnfermedad = parseColombianDecimal(raw['Tasa de enfermedad laboral -ATEL-']);

  return {
    id: `${year}-${sector.replace(/\s+/g, '-').slice(0, 30)}-${index}`,
    year,
    sector,
    rawSector,
    isTotalGeneral,
    afiliadosDependientes,
    estudiantes,
    afiliadosIndependientes,
    totalAfiliados,
    accidentesCalificados,
    enfermedadesCalificadas,
    muertesAccidentes,
    muertesEnfermedad,
    totalMuertes,
    tasaAccidentalidad,
    tasaMortalidad,
    tasaEnfermedad,
  };
}

/**
 * Regla de cálculo oficial:
 * Variación (%) = ((valor actual - valor anterior) / valor anterior) * 100
 * Si valor anterior es 0 o no existe: "No calculable"
 */
export function calculatePercentageVariation(
  current: number,
  previous: number | null | undefined
): VariationResult {
  if (previous === null || previous === undefined || previous === 0 || isNaN(previous)) {
    return {
      pct: null,
      label: 'No calculable',
      isCalculable: false,
      trend: 'na',
    };
  }

  const diff = current - previous;
  const pct = (diff / previous) * 100;
  const formatted = `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;

  let trend: 'up' | 'down' | 'neutral' = 'neutral';
  if (pct > 0.05) trend = 'up';
  else if (pct < -0.05) trend = 'down';

  return {
    pct,
    label: formatted,
    isCalculable: true,
    trend,
  };
}

/**
 * Formateo numérico estilo colombiano/latinoamericano
 */
export function formatNumber(val: number, decimals: number = 0): string {
  if (val === null || val === undefined || isNaN(val)) return '0';
  return val.toLocaleString('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Calcula los KPI principales y de contexto para un subconjunto de datos
 */
export function computeKpiMetrics(
  allRecords: LaborRecord[],
  selectedYear: string,
  selectedSector: string
): KpiMetrics {
  // Ordenar años disponibles
  const availableYears = Array.from(new Set(allRecords.map((r) => r.year)))
    .filter((y) => y > 0)
    .sort((a, b) => b - a);

  const latestYear = availableYears[0] || 2025;
  const targetYear = selectedYear === 'ALL' ? latestYear : parseInt(selectedYear, 10);
  const targetPrevYear = targetYear - 1;

  // Filtrar registros del año objetivo y del año anterior según sector
  const filterBySector = (records: LaborRecord[], yr: number) => {
    let yearRecords = records.filter((r) => r.year === yr);
    if (selectedSector === 'ALL') {
      // Usar fila oficial "Total general" para evitar doble conteo
      const totalGeneral = yearRecords.find((r) => r.isTotalGeneral);
      if (totalGeneral) return [totalGeneral];
      return yearRecords;
    } else if (selectedSector === 'TOTAL_GENERAL') {
      return yearRecords.filter((r) => r.isTotalGeneral);
    } else {
      return yearRecords.filter((r) => r.sector === selectedSector);
    }
  };

  const currentSet = filterBySector(allRecords, targetYear);
  const prevSet = filterBySector(allRecords, targetPrevYear);

  const currentRec = currentSet[0];
  const prevRec = prevSet.length > 0 ? prevSet[0] : null;

  // Si tenemos registro único (Total general o sector específico):
  const tasaAccidentalidad = currentRec ? currentRec.tasaAccidentalidad : 0;
  const tasaAccidentalidadPrev = prevRec ? prevRec.tasaAccidentalidad : null;
  const tasaAccidentalidadVar = calculatePercentageVariation(tasaAccidentalidad, tasaAccidentalidadPrev);

  const totalAccidentes = currentRec ? currentRec.accidentesCalificados : 0;
  const totalAccidentesPrev = prevRec ? prevRec.accidentesCalificados : null;
  const totalAccidentesVar = calculatePercentageVariation(totalAccidentes, totalAccidentesPrev);

  const muertesAccidentes = currentRec ? currentRec.muertesAccidentes : 0;
  const muertesEnfermedad = currentRec ? currentRec.muertesEnfermedad : 0;
  const totalMuertes = currentRec ? currentRec.totalMuertes : 0;
  const totalMuertesPrev = prevRec ? prevRec.totalMuertes : null;
  const totalMuertesVar = calculatePercentageVariation(totalMuertes, totalMuertesPrev);

  const tasaMortalidad = currentRec ? currentRec.tasaMortalidad : 0;
  const tasaMortalidadPrev = prevRec ? prevRec.tasaMortalidad : null;
  const tasaMortalidadVar = calculatePercentageVariation(tasaMortalidad, tasaMortalidadPrev);

  const totalEnfermedades = currentRec ? currentRec.enfermedadesCalificadas : 0;
  const totalEnfermedadesPrev = prevRec ? prevRec.enfermedadesCalificadas : null;
  const totalEnfermedadesVar = calculatePercentageVariation(totalEnfermedades, totalEnfermedadesPrev);

  const tasaEnfermedad = currentRec ? currentRec.tasaEnfermedad : 0;
  const tasaEnfermedadPrev = prevRec ? prevRec.tasaEnfermedad : null;
  const tasaEnfermedadVar = calculatePercentageVariation(tasaEnfermedad, tasaEnfermedadPrev);

  const totalAfiliados = currentRec ? currentRec.totalAfiliados : 0;
  const totalAfiliadosPrev = prevRec ? prevRec.totalAfiliados : null;
  const totalAfiliadosVar = calculatePercentageVariation(totalAfiliados, totalAfiliadosPrev);

  return {
    currentYear: targetYear,
    previousYear: prevRec ? targetPrevYear : null,
    tasaAccidentalidad,
    tasaAccidentalidadPrev,
    tasaAccidentalidadVar,
    totalAccidentes,
    totalAccidentesPrev,
    totalAccidentesVar,
    muertesAccidentes,
    muertesEnfermedad,
    totalMuertes,
    totalMuertesPrev,
    totalMuertesVar,
    tasaMortalidad,
    tasaMortalidadPrev,
    tasaMortalidadVar,
    totalEnfermedades,
    totalEnfermedadesPrev,
    totalEnfermedadesVar,
    tasaEnfermedad,
    tasaEnfermedadPrev,
    tasaEnfermedadVar,
    totalAfiliados,
    afiliadosDependientes: currentRec ? currentRec.afiliadosDependientes : 0,
    afiliadosIndependientes: currentRec ? currentRec.afiliadosIndependientes : 0,
    estudiantes: currentRec ? currentRec.estudiantes : 0,
    totalAfiliadosVar,
  };
}

/**
 * Genera el panel de hallazgos y alertas descriptivas
 * Basado estrictamente en los datos observados, sin inferir causalidad arbitraria.
 */
export function generateFindings(
  allRecords: LaborRecord[],
  metrics: KpiMetrics,
  selectedYear: string,
  _selectedSector: string
): Finding[] {
  const findings: Finding[] = [];
  const targetYear = typeof metrics.currentYear === 'number' ? metrics.currentYear : 2025;

  // 1. Hallazgo de Tasa de Accidentalidad
  if (metrics.tasaAccidentalidadVar.isCalculable && metrics.tasaAccidentalidadVar.pct !== null) {
    const pct = metrics.tasaAccidentalidadVar.pct;
    const isReduction = pct < 0;

    findings.push({
      id: 'f-accid-trend',
      type: isReduction ? 'FAVORABLE' : 'ALERTA',
      category: 'Accidentalidad',
      title: isReduction
        ? `Reducción observada en la tasa de accidentalidad (${targetYear})`
        : `Incremento registrado en la tasa de accidentalidad (${targetYear})`,
      description: isReduction
        ? `La tasa oficial de accidentalidad se situó en ${metrics.tasaAccidentalidad.toFixed(2)} por cada 100 afiliados en ${targetYear}, registrando una variación de ${metrics.tasaAccidentalidadVar.label} respecto al año anterior (${metrics.tasaAccidentalidadPrev?.toFixed(2)}).`
        : `La tasa oficial de accidentalidad se ubicó en ${metrics.tasaAccidentalidad.toFixed(2)} por cada 100 afiliados en ${targetYear}, con un alza de ${metrics.tasaAccidentalidadVar.label} frente al año previo (${metrics.tasaAccidentalidadPrev?.toFixed(2)}).`,
      dataPoint: `Tasa: ${metrics.tasaAccidentalidad.toFixed(2)}% | Accidentes: ${formatNumber(metrics.totalAccidentes)}`,
      criterion: `Variación porcentual estandarizada: ((valor actual - anterior) / anterior) × 100.`,
      recommendation:
        'Continuar con el fortalecimiento de los Sistemas de Gestión de Seguridad y Salud en el Trabajo (SG-SST) e investigar si la variación responde a mejoras operativas preventivas o cambios en la dinámica de reporte.',
    });
  }

  // 2. Sectores con mayor accidentalidad en el año analizado
  const yearSectors = allRecords.filter((r) => r.year === targetYear && !r.isTotalGeneral);
  if (yearSectors.length > 0) {
    const sortedByTasa = [...yearSectors].sort((a, b) => b.tasaAccidentalidad - a.tasaAccidentalidad);
    const topSector = sortedByTasa[0];
    const top3Names = sortedByTasa.slice(0, 3).map((s) => `${s.sector} (${s.tasaAccidentalidad.toFixed(2)}%)`).join(', ');

    findings.push({
      id: 'f-sectors-risk',
      type: 'ALERTA',
      category: 'Accidentalidad',
      title: `Sectores con mayor tasa de accidentalidad en ${targetYear}`,
      description: `El sector con la mayor tasa oficial de accidentalidad reportada fue "${topSector.sector}" con ${topSector.tasaAccidentalidad.toFixed(2)} accidentes por cada 100 afiliados. Los tres sectores con tasas relativas más altas fueron: ${top3Names}.`,
      dataPoint: `${topSector.sector}: ${topSector.tasaAccidentalidad.toFixed(2)}% (${formatNumber(topSector.accidentesCalificados)} accidentes)`,
      criterion: 'Jerarquización por tasa oficial de accidentalidad sobre trabajadores afiliados en el periodo.',
      recommendation:
        'Focalizar inspecciones de prevención y asesoría de las Administradoras de Riesgos Laborales (ARL) en las actividades de mayor exposición física y riesgo clasificado.',
    });
  }

  // 3. Hallazgo de Mortalidad Laboral
  findings.push({
    id: 'f-mortality',
    type: metrics.totalMuertes > 50 ? 'ALERTA' : 'OBSERVACION',
    category: 'Mortalidad',
    title: `Distribución de la mortalidad laboral en Bogotá (${targetYear})`,
    description: `En ${targetYear} se registraron ${formatNumber(metrics.totalMuertes)} muertes laborales calificadas en Bogotá D. C. La causa predominante correspondió a ${
      metrics.muertesAccidentes >= metrics.muertesEnfermedad ? 'accidentes de trabajo' : 'enfermedad laboral'
    } con ${formatNumber(metrics.muertesAccidentes)} casos (${(
      (metrics.muertesAccidentes / (metrics.totalMuertes || 1)) *
      100
    ).toFixed(1)}%), frente a ${formatNumber(metrics.muertesEnfermedad)} muertes calificadas por enfermedad laboral.`,
    dataPoint: `Total: ${formatNumber(metrics.totalMuertes)} | Accidentes: ${formatNumber(metrics.muertesAccidentes)} | Enf. Laboral: ${formatNumber(metrics.muertesEnfermedad)}`,
    criterion: 'Conteo de categorías mutuamente excluyentes validadas en el conjunto oficial.',
    recommendation:
      'Fortalecer los protocolos de respuesta ante accidentes graves y fatales, e intensificar los comités paritarios (COPASST) en investigación inmediata de causas raíz.',
  });

  // 4. Hallazgo Histórico Especial: Impacto 2020 en Enfermedades Laborales
  const rec2020 = allRecords.find((r) => r.year === 2020 && r.isTotalGeneral);
  if (rec2020 && (selectedYear === 'ALL' || selectedYear === '2020')) {
    findings.push({
      id: 'f-covid-2020',
      type: 'ESTRUCTURAL',
      category: 'Enfermedad Laboral',
      title: 'Pico epidemiológico histórico en 2020 (Decreto 676 de 2020)',
      description: `En 2020 se observa el valor máximo de la serie histórica en la tasa de enfermedad laboral: 678,4 por cada 100.000 afiliados. Este comportamiento coincide con la calificación directa del COVID-19 como enfermedad laboral para el personal de salud y apoyo asistencial durante la emergencia sanitaria.`,
      dataPoint: `2020: 678,4 por 100k vs 2025: ${metrics.tasaEnfermedad.toFixed(1)} por 100k`,
      criterion: 'Comportamiento atípico estadístico en la serie temporal 2011–2025 documentado en normatividad laboral.',
      recommendation:
        'Tener en cuenta esta discontinuidad al realizar proyecciones o comparaciones de series de tiempo para evitar sesgos analíticos.',
    });
  }

  // 5. Hallazgo sobre cobertura laboral
  if (metrics.totalAfiliados > 0) {
    const pctIndep = ((metrics.afiliadosIndependientes / metrics.totalAfiliados) * 100).toFixed(1);
    findings.push({
      id: 'f-coverage',
      type: 'OBSERVACION',
      category: 'Cobertura',
      title: `Estructura de la población afiliada al SGRL (${targetYear})`,
      description: `De los ${formatNumber(metrics.totalAfiliados)} afiliados reportados en Bogotá, el ${pctIndep}% (${formatNumber(metrics.afiliadosIndependientes)}) son trabajadores independientes, mientras que ${formatNumber(metrics.afiliadosDependientes)} corresponden a dependientes y ${formatNumber(metrics.estudiantes)} a estudiantes vinculados.`,
      dataPoint: `Dependientes: ${formatNumber(metrics.afiliadosDependientes)} | Independientes: ${formatNumber(metrics.afiliadosIndependientes)} | Estudiantes: ${formatNumber(metrics.estudiantes)}`,
      criterion: 'Distribución porcentual de los tipos de afiliación reglamentados en el Decreto 1072 de 2015.',
      recommendation:
        'Adaptar los planes de capacitación de las ARL a las modalidades de contratación independiente y trabajo por plataformas.',
    });
  }

  return findings;
}
