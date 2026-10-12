import React from 'react';
import {
  Sparkles,
  X,
  Loader2,
  AlertOctagon,
  RefreshCw,
  CheckCircle2,
  TrendingUp,
  Target,
  FileCheck2,
  HelpCircle,
  ShieldAlert,
  ArrowRight,
  Info,
} from 'lucide-react';
import { GeminiSecondOpinionResponse } from '../types/data';

interface GeminiSecondOpinionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  error: string | null;
  opinion: GeminiSecondOpinionResponse | null;
  onRetry: () => void;
  selectedYear: string;
  selectedSector: string;
}

export const GeminiSecondOpinionModal: React.FC<GeminiSecondOpinionModalProps> = ({
  isOpen,
  onClose,
  isLoading,
  error,
  opinion,
  onRetry,
  selectedYear,
  selectedSector,
}) => {
  if (!isOpen) return null;

  const yearLabel = selectedYear === 'ALL' ? 'Serie histórica 2011–2025' : `Año ${selectedYear}`;
  const sectorLabel =
    selectedSector === 'ALL'
      ? 'Distrito Capital (Consolidado general)'
      : selectedSector === 'TOTAL_GENERAL'
      ? 'Total general oficial'
      : selectedSector;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
        {/* Header del Modal */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Segunda Opinión Analítica de Gemini
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Gemini AI
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Acción alternativa fundamentada exclusivamente en los datos del Observatorio
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de contexto analizado */}
        <div className="bg-slate-50 px-5 py-2.5 border-b border-slate-200/80 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Contexto analizado:</span>
            <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 font-medium text-[11px]">
              {yearLabel}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 font-medium text-[11px] max-w-[220px] truncate">
              {sectorLabel}
            </span>
          </div>

          {opinion && !isLoading && (
            <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Análisis generado con éxito
            </span>
          )}
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-5 sm:p-6 flex-1 overflow-y-auto">
          {/* ESTADO 1: CARGANDO */}
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="relative mb-4">
                <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 border border-indigo-100 animate-pulse">
                  <Sparkles className="w-8 h-8" />
                </div>
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin absolute -top-1 -right-1" />
              </div>

              <h4 className="text-base font-bold text-slate-900 mb-1">
                Generando Segunda Opinión Técnica...
              </h4>
              <p className="text-xs text-slate-500 max-w-md mb-6">
                Gemini está analizando los indicadores oficiales, contrastando variaciones de tasas y evaluando una acción complementaria orientada a la prevención.
              </p>

              <div className="w-full max-w-sm space-y-2 text-left bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                  <span>Examinando accidentalidad, mortalidad y enfermedades calificadas...</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                  <span>Estructurando justificación y limitaciones del análisis...</span>
                </div>
              </div>
            </div>
          )}

          {/* ESTADO 2: ERROR */}
          {!isLoading && error && (
            <div className="py-8 flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 mb-3">
                <AlertOctagon className="w-8 h-8" />
              </div>

              <h4 className="text-base font-bold text-slate-900 mb-1">
                No fue posible generar la segunda opinión
              </h4>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Ocurrió un inconveniente al comunicarse con el servicio analítico. El resto del Observatorio continúa funcionando con normalidad.
              </p>

              <div className="w-full bg-rose-50/80 p-3 rounded-lg border border-rose-200 text-xs text-rose-800 text-left mb-5 font-mono break-all">
                {error}
              </div>

              <button
                onClick={onRetry}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Reintentar análisis
              </button>
            </div>
          )}

          {/* ESTADO 3: RESPUESTA EXITOSA DE GEMINI */}
          {!isLoading && !error && opinion && (
            <div className="space-y-5 text-slate-700 text-xs leading-relaxed">
              {/* 1. Hallazgo identificado */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 rounded bg-blue-100 text-blue-700">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    1. Hallazgo identificado
                  </h4>
                </div>
                <p className="text-slate-800 font-medium leading-normal">
                  {opinion.hallazgoIdentificado}
                </p>
              </div>

              {/* 2. Acción alternativa o complementaria recomendada */}
              <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-xl p-4 border-2 border-blue-500/30 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 rounded bg-blue-600 text-white">
                    <Target className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-blue-950 text-xs uppercase tracking-wider">
                    2. Acción alternativa o complementaria recomendada
                  </h4>
                </div>
                <p className="text-slate-900 font-bold text-sm leading-snug">
                  {opinion.accionPropuesta}
                </p>
              </div>

              {/* 3. Datos que respaldan la recomendación */}
              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="p-1 rounded bg-emerald-100 text-emerald-700">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    3. Datos del Observatorio que respaldan la recomendación
                  </h4>
                </div>
                <ul className="space-y-1.5">
                  {opinion.datosQueRespaldan.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200/70">
                      <ArrowRight className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span className="font-medium text-slate-800 text-[11px]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 4. Justificación de la acción */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 rounded bg-amber-100 text-amber-800">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    4. Justificación de la acción
                  </h4>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  {opinion.justificacion}
                </p>
              </div>

              {/* 5. Resultado esperado */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 rounded bg-purple-100 text-purple-700">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    5. Resultado esperado
                  </h4>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  {opinion.resultadoEsperado}
                </p>
              </div>

              {/* 6. Limitaciones del análisis */}
              <div className="bg-amber-50/70 rounded-xl p-4 border border-amber-200 text-amber-900">
                <div className="flex items-center gap-2 mb-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-700" />
                  <h4 className="font-bold text-amber-900 text-xs uppercase tracking-wider">
                    6. Limitaciones del análisis
                  </h4>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  {opinion.limitaciones}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer del Modal */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-500" />
            <span>
              Segunda opinión fundamentada exclusivamente en la serie oficial del SGRL de Bogotá.
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {!isLoading && opinion && (
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold transition-colors cursor-pointer"
                title="Volver a consultar una perspectiva complementaria"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Actualizar opinión
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
