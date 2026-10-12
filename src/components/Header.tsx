import React from 'react';
import {
  ShieldAlert,
  RefreshCw,
  Info,
  Database,
  ExternalLink,
  CheckCircle2,
  Clock,
  Building2,
} from 'lucide-react';
import { ResourceMetadata } from '../types/data';

interface HeaderProps {
  metadata: ResourceMetadata | null;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenAbout: () => void;
  recordsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  metadata,
  isLoading,
  onRefresh,
  onOpenAbout,
  recordsCount,
}) => {
  const formattedFetchDate = metadata?.fetchedAt
    ? new Date(metadata.fetchedAt).toLocaleString('es-CO', {
        dateStyle: 'short',
        timeStyle: 'medium',
      })
    : 'No disponible';

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md">
      {/* Top micro-bar for institutional context */}
      <div className="bg-slate-950 px-4 py-1.5 border-b border-slate-800/80 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-slate-300">
              Datos Abiertos Bogotá D. C.
            </span>
            <span className="text-slate-600">|</span>
            <span>Secretaría Distrital de Salud</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">ID: d884613c-911c-44c4-89f0-b2f8bda862c6</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Consulta: {formattedFetchDate}
            </span>
            <span className="text-slate-600">|</span>
            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Sincronizado
            </span>
          </div>
        </div>
      </div>

      {/* Main Branding & Navigation Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400 shrink-0 shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Observatorio de Seguridad y Salud Laboral de Bogotá
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-300 border border-blue-400/20">
                  BI 2011–2025
                </span>
              </div>
              <p className="mt-1 text-sm sm:text-base text-slate-300">
                Inteligencia de negocios para la prevención de riesgos laborales
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-blue-400" />
                  {recordsCount} registros oficiales validados
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-blue-400" />
                  Sectores económicos y agregado distrital
                </span>
                <a
                  href="https://datosabiertos.bogota.gov.co/dataset/accidentalidad-enfermedad-y-mortalidad-laboral-en-bogota-d-c"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 underline decoration-blue-500/40 transition-colors"
                >
                  Portal oficial CKAN
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 self-start md:self-center">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Volver a consultar los datos oficiales de Bogotá"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 hover:border-slate-600 transition-all shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
              <span>{isLoading ? 'Consultando...' : 'Actualizar datos'}</span>
            </button>

            <button
              onClick={onOpenAbout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all shadow-xs"
            >
              <Info className="w-4 h-4" />
              <span>Acerca de los datos</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
