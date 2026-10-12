import React from 'react';
import { Filter, RotateCcw, Search, Calendar, Briefcase, Activity } from 'lucide-react';
import { FilterState } from '../types/data';

interface FiltersProps {
  filters: FilterState;
  onChange: (updated: Partial<FilterState>) => void;
  onReset: () => void;
  availableYears: number[];
  availableSectors: string[];
  totalFilteredCount: number;
  totalRecordsCount: number;
}

export const Filters: React.FC<FiltersProps> = ({
  filters,
  onChange,
  onReset,
  availableYears,
  availableSectors,
  totalFilteredCount,
  totalRecordsCount,
}) => {
  const isFiltered =
    filters.selectedYear !== 'ALL' ||
    filters.selectedSector !== 'ALL' ||
    filters.indicatorType !== 'ALL' ||
    filters.searchTerm.trim() !== '';

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-5 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Filtros Analíticos de Inteligencia de Negocios
            </h2>
            <p className="text-xs text-slate-500">
              Personalice las dimensiones temporales, sectoriales y tipos de indicador
            </p>
          </div>
        </div>

        {/* Counter and reset button */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
            Mostrando <span className="font-bold text-blue-700">{totalFilteredCount}</span> de{' '}
            {totalRecordsCount} registros
          </span>

          {isFiltered && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restablecer filtros
            </button>
          )}
        </div>
      </div>

      {/* Filter Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4">
        {/* 1. Selector de Año */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            Año de corte
          </label>
          <div className="relative">
            <select
              value={filters.selectedYear}
              onChange={(e) => onChange({ selectedYear: e.target.value })}
              className="w-full bg-slate-50 hover:bg-slate-100/70 border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium transition-all"
            >
              <option value="ALL">Todos los años (Serie histórica 2011–2025)</option>
              {availableYears.map((year) => (
                <option key={year} value={year.toString()}>
                  Año {year} {year === 2025 ? '(Más reciente oficial)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 2. Selector de Sector Económico */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-blue-600" />
            Sector económico
          </label>
          <div className="relative">
            <select
              value={filters.selectedSector}
              onChange={(e) => onChange({ selectedSector: e.target.value })}
              className="w-full bg-slate-50 hover:bg-slate-100/70 border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium transition-all truncate"
            >
              <option value="ALL">Todos los sectores (Consolidado oficial distrital)</option>
              <option value="TOTAL_GENERAL">Solo fila "Total general" (Distrito Capital)</option>
              <optgroup label="Sectores específicos desagregados">
                {availableSectors
                  .filter((s) => s.toLowerCase() !== 'total general')
                  .map((sector) => (
                    <option key={sector} value={sector}>
                      {sector}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* 3. Selector de Tipo de Indicador */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            Tipo de indicador
          </label>
          <div className="relative">
            <select
              value={filters.indicatorType}
              onChange={(e) => onChange({ indicatorType: e.target.value as any })}
              className="w-full bg-slate-50 hover:bg-slate-100/70 border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium transition-all"
            >
              <option value="ALL">Todos los indicadores (Visión integral)</option>
              <option value="ACCIDENTALIDAD">Accidentalidad laboral</option>
              <option value="MORTALIDAD">Mortalidad laboral</option>
              <option value="ENFERMEDAD">Enfermedad laboral (ATEL)</option>
            </select>
          </div>
        </div>

        {/* 4. Campo de búsqueda rápida */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-blue-600" />
            Búsqueda por texto
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar sector o palabra..."
              value={filters.searchTerm}
              onChange={(e) => onChange({ searchTerm: e.target.value })}
              className="w-full bg-slate-50 hover:bg-slate-100/70 border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg pl-8 pr-3 py-2 text-sm text-slate-800 font-medium transition-all placeholder:text-slate-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            {filters.searchTerm && (
              <button
                onClick={() => onChange({ searchTerm: '' })}
                className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
