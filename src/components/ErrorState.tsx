import React from 'react';
import { AlertOctagon, RefreshCw, ExternalLink, Globe } from 'lucide-react';

interface ErrorStateProps {
  errorMessage: string;
  onRetry: () => void;
  isRetrying: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  errorMessage,
  onRetry,
  isRetrying,
}) => {
  return (
    <div className="min-h-[500px] flex items-center justify-center p-6 bg-slate-50/50">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-rose-200 max-w-lg w-full text-center">
        <div className="p-4 bg-rose-50 rounded-2xl text-rose-600 inline-block mb-4 border border-rose-100">
          <AlertOctagon className="w-10 h-10" />
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-2">
          Error en la Consulta de Datos Oficiales
        </h3>
        <p className="text-xs text-slate-600 mb-5 leading-relaxed">
          No fue posible completar la consulta contra el conjunto de datos de la Alcaldía Mayor de Bogotá D. C.
        </p>

        {/* Detalle técnico del error */}
        <div className="bg-rose-50/70 text-rose-800 p-4 rounded-xl border border-rose-200/80 text-xs text-left mb-6 font-mono break-all leading-normal">
          <strong className="block text-rose-900 font-sans mb-1 font-semibold">
            Detalle del error reportado:
          </strong>
          {errorMessage || 'Fallo de red o servicio no disponible en el portal de datos abiertos.'}
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Reintentando...' : 'Reintentar consulta'}
          </button>

          <a
            href="https://datosabiertos.bogota.gov.co/dataset/accidentalidad-enfermedad-y-mortalidad-laboral-en-bogota-d-c"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors border border-slate-200"
          >
            <Globe className="w-4 h-4" />
            Verificar portal en línea
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>
    </div>
  );
};
