import React from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  FileText,
  Shield,
  ArrowUpRight,
  TrendingDown,
  Info,
  Sparkles,
} from 'lucide-react';
import { Finding } from '../types/data';

interface FindingsAlertsProps {
  findings: Finding[];
  selectedYear: string;
  onRequestSecondOpinion?: () => void;
  isSecondOpinionLoading?: boolean;
}

export const FindingsAlerts: React.FC<FindingsAlertsProps> = ({
  findings,
  selectedYear,
  onRequestSecondOpinion,
  isSecondOpinionLoading = false,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 mb-8">
      {/* Encabezado de la sección */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Panel de Hallazgos Estadísticos y Alertas Preventivas
            </h3>
            <p className="text-xs text-slate-500">
              Interpretación descriptiva de datos oficiales para orientar decisiones de salud ocupacional
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
            <Info className="w-3.5 h-3.5 text-blue-500" />
            Criterios basados en datos observados
          </span>

          {onRequestSecondOpinion && (
            <button
              onClick={onRequestSecondOpinion}
              disabled={isSecondOpinionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              <span>Pedir una segunda opinión a Gemini</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid de hallazgos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
        {findings.map((finding) => {
          let badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
          let icon = <Info className="w-4 h-4 text-blue-600" />;

          if (finding.type === 'ALERTA') {
            badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
            icon = <AlertTriangle className="w-4 h-4 text-rose-600" />;
          } else if (finding.type === 'FAVORABLE') {
            badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            icon = <TrendingDown className="w-4 h-4 text-emerald-600" />;
          } else if (finding.type === 'ESTRUCTURAL') {
            badgeColor = 'bg-purple-50 text-purple-700 border-purple-200';
            icon = <Lightbulb className="w-4 h-4 text-purple-600" />;
          }

          return (
            <div
              key={finding.id}
              className="bg-slate-50/70 hover:bg-slate-50 rounded-xl p-4 border border-slate-200/90 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header del Hallazgo */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${badgeColor}`}>
                      {icon}
                      {finding.type}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      • {finding.category}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {selectedYear === 'ALL' ? 'Serie 2011–2025' : `Año ${selectedYear}`}
                  </span>
                </div>

                {/* Título y descripción descriptiva */}
                <h4 className="text-sm font-bold text-slate-900 mb-1.5">
                  {finding.title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  {finding.description}
                </p>

                {/* Cifra de evidencia */}
                <div className="bg-white rounded-lg p-2.5 border border-slate-200 text-xs font-medium text-slate-800 flex items-center justify-between mb-3 shadow-2xs">
                  <span className="text-slate-500 text-[11px]">Evidencia oficial:</span>
                  <span className="font-bold text-blue-700">{finding.dataPoint}</span>
                </div>
              </div>

              {/* Recomendación y Metodología */}
              <div className="pt-3 border-t border-slate-200/80 space-y-2">
                <div className="flex items-start gap-1.5 text-[11px] text-slate-500">
                  <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-600">Criterio:</strong> {finding.criterion}
                  </span>
                </div>

                <div className="flex items-start gap-1.5 text-[11px] text-blue-900 bg-blue-50/80 p-2 rounded-md border border-blue-100">
                  <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-blue-800">Recomendación preventiva:</strong>{' '}
                    {finding.recommendation}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Nota metodológica sobre causalidad */}
      <div className="mt-5 p-3 rounded-lg bg-amber-50/60 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p>
          <strong>Advertencia de rigor metodológico:</strong> Los hallazgos presentados reflejan variaciones numéricas y jerarquizaciones cuantitativas registradas en los datos oficiales abiertos de Bogotá D. C. Una reducción o incremento en un indicador describe la variación observada y no presupone causalidad directa ni descarta posibles variaciones en los patrones de reporte o cobertura del SGRL.
        </p>
      </div>
    </div>
  );
};
