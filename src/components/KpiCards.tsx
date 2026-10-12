import React from 'react';
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Skull,
  Stethoscope,
  Users,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { KpiMetrics, VariationResult } from '../types/data';
import { formatNumber } from '../utils/calculations';

interface KpiCardsProps {
  metrics: KpiMetrics;
  selectedYear: string;
  selectedSector: string;
}

// Componente para renderizar la insignia de variación porcentual
const VariationBadge: React.FC<{
  variation: VariationResult;
  isDesirableLower?: boolean; // True si una disminución es favorable (ej. accidentes, muertes)
}> = ({ variation, isDesirableLower = true }) => {
  if (!variation.isCalculable || variation.pct === null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
        <HelpCircle className="w-3 h-3 text-slate-400" />
        {variation.label}
      </span>
    );
  }

  const isPositiveNumber = variation.pct > 0;
  const isFavorable = isDesirableLower ? !isPositiveNumber : isPositiveNumber;

  if (Math.abs(variation.pct) < 0.05) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
        Estable (0.0%)
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md border ${
        isFavorable
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-rose-50 text-rose-700 border-rose-200'
      }`}
      title={`Variación frente al año ${variation.isCalculable ? 'anterior' : ''}: ((actual - previo) / previo) × 100`}
    >
      {isPositiveNumber ? (
        <TrendingUp className="w-3.5 h-3.5" />
      ) : (
        <TrendingDown className="w-3.5 h-3.5" />
      )}
      {variation.label} {isFavorable ? 'favorable' : 'alerta'}
    </span>
  );
};

export const KpiCards: React.FC<KpiCardsProps> = ({
  metrics,
  selectedYear,
  selectedSector,
}) => {
  const yearLabel = selectedYear === 'ALL' ? `${metrics.currentYear} (Vigencia oficial)` : `Año ${selectedYear}`;
  const sectorLabel =
    selectedSector === 'ALL'
      ? 'Distrito Capital (Total general)'
      : selectedSector === 'TOTAL_GENERAL'
      ? 'Total general oficial'
      : selectedSector;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* KPI 1: Tasa de Accidentalidad Laboral */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col justify-between hover:border-slate-300 transition-all">
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              KPI 1 • Accidentalidad
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="mb-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                {metrics.tasaAccidentalidad.toFixed(2)}%
              </span>
              <span className="text-xs text-slate-500 font-medium">
                tasa oficial
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Accidentes por cada 100 trabajadores afiliados
            </p>
          </div>

          {/* Variación */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              vs. {metrics.previousYear || 'año previo'}:
            </span>
            <VariationBadge variation={metrics.tasaAccidentalidadVar} isDesirableLower={true} />
          </div>
        </div>

        {/* Cifra absoluta de accidentes */}
        <div className="mt-4 pt-3 border-t border-slate-100/80 bg-slate-50/70 -mx-5 -mb-5 p-4 rounded-b-xl">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Accidentes calificados:</span>
            <span className="font-bold text-slate-900">
              {formatNumber(metrics.totalAccidentes)} casos
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
            <span>Var. casos absolutos:</span>
            <span>{metrics.totalAccidentesVar.label}</span>
          </div>
        </div>
      </div>

      {/* KPI 2: Mortalidad Laboral */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col justify-between hover:border-slate-300 transition-all">
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-600" />
              KPI 2 • Mortalidad Total
            </span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-700">
              <Skull className="w-5 h-5" />
            </div>
          </div>

          <div className="mb-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                {formatNumber(metrics.totalMuertes)}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                muertes validadas
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Tasa oficial: <span className="font-bold text-slate-800">{metrics.tasaMortalidad.toFixed(1)}</span> por cada 100.000 afiliados
            </p>
          </div>

          {/* Variación */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              vs. {metrics.previousYear || 'año previo'}:
            </span>
            <VariationBadge variation={metrics.totalMuertesVar} isDesirableLower={true} />
          </div>
        </div>

        {/* Desglose de muertes: accidentes vs enfermedad */}
        <div className="mt-4 pt-3 border-t border-slate-100/80 bg-slate-50/70 -mx-5 -mb-5 p-4 rounded-b-xl">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500 text-[11px] block">Por accidente:</span>
              <span className="font-bold text-slate-800">{formatNumber(metrics.muertesAccidentes)}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Por enf. laboral:</span>
              <span className="font-bold text-slate-800">{formatNumber(metrics.muertesEnfermedad)}</span>
            </div>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Categorías mutuamente excluyentes
          </div>
        </div>
      </div>

      {/* KPI 3 (Complementario): Tasa de Enfermedad Laboral */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col justify-between hover:border-slate-300 transition-all">
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              Complementario • Enf. Laboral
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
              <Stethoscope className="w-5 h-5" />
            </div>
          </div>

          <div className="mb-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                {metrics.tasaEnfermedad.toFixed(1)}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                por 100k
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Tasa oficial de enfermedad laboral calificada -ATEL-
            </p>
          </div>

          {/* Variación */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              vs. {metrics.previousYear || 'año previo'}:
            </span>
            <VariationBadge variation={metrics.tasaEnfermedadVar} isDesirableLower={true} />
          </div>
        </div>

        {/* Casos absolutos de enfermedad laboral */}
        <div className="mt-4 pt-3 border-t border-slate-100/80 bg-slate-50/70 -mx-5 -mb-5 p-4 rounded-b-xl">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Enfermedades calificadas:</span>
            <span className="font-bold text-slate-900">
              {formatNumber(metrics.totalEnfermedades)} casos
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
            <span>Var. casos absolutos:</span>
            <span>{metrics.totalEnfermedadesVar.label}</span>
          </div>
        </div>
      </div>

      {/* KPI 4: Población Trabajadora Afiliada (Contexto Denominador) */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col justify-between hover:border-slate-300 transition-all">
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              Población • Afiliados SGRL
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="mb-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                {formatNumber(metrics.totalAfiliados)}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                afiliados
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Denominador de cálculo de tasas oficiales
            </p>
          </div>

          {/* Variación */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              vs. {metrics.previousYear || 'año previo'}:
            </span>
            <VariationBadge variation={metrics.totalAfiliadosVar} isDesirableLower={false} />
          </div>
        </div>

        {/* Desglose de afiliados */}
        <div className="mt-4 pt-3 border-t border-slate-100/80 bg-slate-50/70 -mx-5 -mb-5 p-4 rounded-b-xl">
          <div className="grid grid-cols-3 gap-1 text-[11px]">
            <div>
              <span className="text-slate-500 block truncate">Depend:</span>
              <span className="font-bold text-slate-800">{formatNumber(metrics.afiliadosDependientes)}</span>
            </div>
            <div>
              <span className="text-slate-500 block truncate">Indep:</span>
              <span className="font-bold text-slate-800">{formatNumber(metrics.afiliadosIndependientes)}</span>
            </div>
            <div>
              <span className="text-slate-500 block truncate">Estud:</span>
              <span className="font-bold text-slate-800">{formatNumber(metrics.estudiantes)}</span>
            </div>
          </div>
          <div className="mt-1 text-[10px] text-slate-400 truncate">
            Corte: {yearLabel} • {sectorLabel}
          </div>
        </div>
      </div>
    </div>
  );
};
