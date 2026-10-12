import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { LaborRecord } from '../types/data';
import { formatNumber } from '../utils/calculations';
import { BarChart3, TrendingUp, Layers, Activity } from 'lucide-react';

interface ChartsSectionProps {
  records: LaborRecord[];
  allRecords: LaborRecord[];
  selectedYear: string;
  selectedSector: string;
  indicatorType: string;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  allRecords,
  selectedYear,
  selectedSector,
  indicatorType,
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACCID' | 'MORT' | 'ENF'>('ALL');

  // 1. Serie histórica de tasas distritales (usando filas 'Total general' para evitar doble conteo)
  const historicalTotals = allRecords
    .filter((r) => r.isTotalGeneral)
    .sort((a, b) => a.year - b.year)
    .map((r) => ({
      year: r.year.toString(),
      tasaAccidentalidad: Number(r.tasaAccidentalidad.toFixed(2)),
      tasaMortalidad: Number(r.tasaMortalidad.toFixed(2)),
      tasaEnfermedad: Number(r.tasaEnfermedad.toFixed(1)),
      accidentes: r.accidentesCalificados,
      muertesTotal: r.totalMuertes,
      muertesAccidente: r.muertesAccidentes,
      muertesEnfermedad: r.muertesEnfermedad,
      enfermedades: r.enfermedadesCalificadas,
    }));

  // 2. Desglose por sector económico para el año seleccionado (o el más reciente)
  const availableYears = Array.from(new Set(allRecords.map((r) => r.year))).sort((a, b) => b - a);
  const targetYear = selectedYear === 'ALL' ? availableYears[0] : parseInt(selectedYear, 10);

  const sectorDataForYear = allRecords
    .filter((r) => r.year === targetYear && !r.isTotalGeneral)
    .sort((a, b) => b.accidentesCalificados - a.accidentesCalificados);

  // Top 10 sectores con más accidentes para el gráfico de barras
  const topSectorsAccidents = sectorDataForYear.slice(0, 10).map((s) => ({
    sector: s.sector.length > 28 ? s.sector.slice(0, 26) + '...' : s.sector,
    sectorCompleto: s.sector,
    accidentes: s.accidentesCalificados,
    tasa: Number(s.tasaAccidentalidad.toFixed(2)),
    afiliados: s.totalAfiliados,
  }));

  // Sectores o Histórico de Mortalidad: comparación muertes accidente vs enfermedad
  const mortalityComparisonData =
    selectedYear === 'ALL'
      ? historicalTotals.map((h) => ({
          name: h.year,
          muertesAccidente: h.muertesAccidente,
          muertesEnfermedad: h.muertesEnfermedad,
          total: h.muertesTotal,
        }))
      : sectorDataForYear
          .filter((s) => s.totalMuertes > 0)
          .sort((a, b) => b.totalMuertes - a.totalMuertes)
          .slice(0, 8)
          .map((s) => ({
            name: s.sector.length > 22 ? s.sector.slice(0, 20) + '...' : s.sector,
            sectorCompleto: s.sector,
            muertesAccidente: s.muertesAccidentes,
            muertesEnfermedad: s.muertesEnfermedad,
            total: s.totalMuertes,
          }));

  // Tooltip personalizado para tasa de accidentalidad
  const CustomLineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs">
          <p className="font-bold text-slate-200 border-b border-slate-700 pb-1 mb-1.5">
            Año {label} (Distrito Capital)
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-bold">
                {entry.value} {entry.dataKey.includes('tasa') ? (entry.dataKey === 'tasaAccidentalidad' ? '%' : 'por 100k') : 'casos'}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Tooltip para barras por sector
  const CustomSectorTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs max-w-xs">
          <p className="font-bold text-slate-200 border-b border-slate-700 pb-1 mb-1.5">
            {data.sectorCompleto || data.sector}
          </p>
          <p className="flex justify-between py-0.5">
            <span className="text-slate-400">Accidentes calificados:</span>
            <span className="font-bold text-blue-400">{formatNumber(data.accidentes)}</span>
          </p>
          {data.tasa !== undefined && (
            <p className="flex justify-between py-0.5">
              <span className="text-slate-400">Tasa de accidentalidad:</span>
              <span className="font-bold text-amber-400">{data.tasa}%</span>
            </p>
          )}
          {data.afiliados !== undefined && (
            <p className="flex justify-between py-0.5">
              <span className="text-slate-400">Población afiliada:</span>
              <span className="font-semibold text-slate-300">{formatNumber(data.afiliados)}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 mb-8">
      {/* Sub-header de visualización con tabs para filtrar vistas si se desea */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Visualización y Análisis Gráfico de Tendencias
          </h3>
          <p className="text-xs text-slate-500">
            Evolución temporal, distribución sectorial y comparación de causalidad
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'ALL'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos los gráficos
          </button>
          <button
            onClick={() => setActiveTab('ACCID')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'ACCID'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Accidentalidad
          </button>
          <button
            onClick={() => setActiveTab('MORT')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'MORT'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mortalidad
          </button>
          <button
            onClick={() => setActiveTab('ENF')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'ENF'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Enf. Laboral
          </button>
        </div>
      </div>

      {/* Grid de Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GRÁFICO 1: Evolución Anual de la Tasa de Accidentalidad */}
        {(activeTab === 'ALL' || activeTab === 'ACCID') && (
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  1. Evolución Histórica de la Tasa de Accidentalidad
                </h4>
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  Por 100 afiliados (%)
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Comportamiento anual oficial en Bogotá D. C. (2011–2025). Muestra una tendencia general de reducción.
              </p>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historicalTotals} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="year" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      domain={[0, 8]}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip content={<CustomLineTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <ReferenceLine y={4.5} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: 'Media ~4.5%', fill: '#64748b', fontSize: 10 }} />
                    <Line
                      type="monotone"
                      dataKey="tasaAccidentalidad"
                      name="Tasa de accidentalidad (%)"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      dot={{ r: 3.5, fill: '#2563eb', strokeWidth: 1.5, stroke: '#fff' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
              <span>Fuente: Tasa oficial reportada en Bogotá D. C.</span>
              <span className="font-semibold text-slate-700">2011: 6,1% → 2025: 3,1%</span>
            </div>
          </div>
        )}

        {/* GRÁFICO 2: Accidentes Calificados por Sector Económico */}
        {(activeTab === 'ALL' || activeTab === 'ACCID') && (
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  2. Accidentes Calificados por Sector ({targetYear})
                </h4>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Volumen absoluto
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Top 10 sectores con mayor número de accidentes de trabajo calificados en {targetYear}.
              </p>

              <div className="h-72 w-full">
                {topSectorsAccidents.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topSectorsAccidents}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" stroke="#64748b" fontSize={10} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                      <YAxis
                        type="category"
                        dataKey="sector"
                        stroke="#64748b"
                        fontSize={10}
                        tickLine={false}
                        width={130}
                      />
                      <Tooltip content={<CustomSectorTooltip />} />
                      <Bar
                        dataKey="accidentes"
                        name="Accidentes calificados"
                        fill="#0ea5e9"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No se reporta desagregación sectorial para este año (solo disponible Total general en fuente oficial).
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
              <span>Sectores económicos clasificados</span>
              <span className="font-semibold text-slate-700">Ordenado por mayor exposición</span>
            </div>
          </div>
        )}

        {/* GRÁFICO 3: Mortalidad Laboral: Accidentes vs Enfermedad Laboral */}
        {(activeTab === 'ALL' || activeTab === 'MORT') && (
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-rose-600" />
                  3. Muertes Laborales: Accidente vs. Enfermedad
                </h4>
                <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                  {selectedYear === 'ALL' ? 'Histórico por año' : `Sectores (${targetYear})`}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Comparación cuantitativa entre muertes por accidente de trabajo y por enfermedad laboral.
              </p>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mortalityComparisonData} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      formatter={(val: any, name: any) => [
                        formatNumber(val) + ' muertes',
                        name === 'muertesAccidente' ? 'Por accidente de trabajo' : 'Por enfermedad laboral',
                      ]}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                      formatter={(v) => (v === 'muertesAccidente' ? 'Muertes por accidente' : 'Muertes por enf. laboral')}
                    />
                    <Bar dataKey="muertesAccidente" name="muertesAccidente" stackId="a" fill="#e11d48" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="muertesEnfermedad" name="muertesEnfermedad" stackId="a" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
              <span>Categorías validadas mutuamente excluyentes</span>
              <span className="font-semibold text-slate-700">Mayor prevalencia: Accidentes</span>
            </div>
          </div>
        )}

        {/* GRÁFICO 4: Tasas de Mortalidad y Enfermedad Laboral */}
        {(activeTab === 'ALL' || activeTab === 'MORT' || activeTab === 'ENF') && (
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-600" />
                  4. Tasas Oficiales de Mortalidad y Enfermedad ATEL
                </h4>
                <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                  Por cada 100.000 afiliados
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Comportamiento de tasas por 100k trabajadores. Nótese el pico de 2020 por calificación COVID-19.
              </p>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historicalTotals} margin={{ top: 10, right: 25, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="year" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      domain={[0, 'auto']}
                      label={{ value: 'Por 100k trabajadores', angle: -90, position: 'insideLeft', fontSize: 9, fill: '#94a3b8' }}
                    />
                    <Tooltip content={<CustomLineTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Line
                      type="monotone"
                      dataKey="tasaEnfermedad"
                      name="Tasa Enf. Laboral (x100k)"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="tasaMortalidad"
                      name="Tasa Mortalidad (x100k)"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
              <span>Denominador: Población total afiliada SGRL</span>
              <span className="font-semibold text-purple-700">Pico 2020: 678,4 por 100k</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
