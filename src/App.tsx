import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LaborRecord,
  ResourceMetadata,
  FilterState,
  GeminiSecondOpinionResponse,
} from './types/data';
import { fetchLaborData, DataSourceMode, CKAN_DATASTORE_URL } from './services/api';
import { requestSecondOpinion } from './services/geminiService';
import { computeKpiMetrics, generateFindings } from './utils/calculations';
import { Header } from './components/Header';
import { Filters } from './components/Filters';
import { KpiCards } from './components/KpiCards';
import { ChartsSection } from './components/ChartsSection';
import { FindingsAlerts } from './components/FindingsAlerts';
import { GeminiSecondOpinionModal } from './components/GeminiSecondOpinionModal';
import { DataTable } from './components/DataTable';
import { AboutDataModal } from './components/AboutDataModal';
import { LoadingState } from './components/LoadingState';
import { ErrorState } from './components/ErrorState';
import { Database, Sparkles, ExternalLink, ShieldCheck, Layers } from 'lucide-react';

export default function App() {
  const [records, setRecords] = useState<LaborRecord[]>([]);
  const [metadata, setMetadata] = useState<ResourceMetadata | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceMode, setSourceMode] = useState<DataSourceMode>('CSV_FULL');
  const [datastoreNotes, setDatastoreNotes] = useState<string>('');
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);

  // Estado para la Segunda Opinión de Gemini
  const [isSecondOpinionOpen, setIsSecondOpinionOpen] = useState<boolean>(false);
  const [isSecondOpinionLoading, setIsSecondOpinionLoading] = useState<boolean>(false);
  const [secondOpinionError, setSecondOpinionError] = useState<string | null>(null);
  const [secondOpinionData, setSecondOpinionData] = useState<GeminiSecondOpinionResponse | null>(null);

  // Estado de los filtros
  const [filters, setFilters] = useState<FilterState>({
    selectedYear: 'ALL',
    selectedSector: 'ALL',
    indicatorType: 'ALL',
    searchTerm: '',
  });

  // Función principal para cargar los datos
  const loadData = useCallback(async (mode: DataSourceMode = sourceMode) => {
    try {
      setError(null);
      if (records.length === 0) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      const result = await fetchLaborData(mode);
      setRecords(result.records);
      setMetadata(result.metadata);
      setDatastoreNotes(result.datastoreComparison.differenceNotes);
      setSourceMode(result.activeMode);
    } catch (err: any) {
      console.error('Error cargando datos oficiales:', err);
      setError(err.message || 'Error desconocido al consultar la API de Bogotá.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [records.length, sourceMode]);

  useEffect(() => {
    loadData('CSV_FULL');
  }, []);

  // Cambiar modo de fuente (CSV vs datastore_search)
  const handleModeChange = (newMode: DataSourceMode) => {
    setSourceMode(newMode);
    loadData(newMode);
  };

  // Listados únicos para los desplegables de filtros
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(records.map((r) => r.year)))
      .filter((y) => y > 0)
      .sort((a, b) => b - a);
    return years;
  }, [records]);

  const availableSectors = useMemo(() => {
    const sectors = Array.from(new Set(records.map((r) => r.sector)))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'es'));
    return sectors;
  }, [records]);

  // Registros filtrados según las dimensiones seleccionadas
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // 1. Filtro de Año
      if (filters.selectedYear !== 'ALL') {
        if (r.year !== parseInt(filters.selectedYear, 10)) return false;
      }

      // 2. Filtro de Sector
      if (filters.selectedSector === 'TOTAL_GENERAL') {
        if (!r.isTotalGeneral) return false;
      } else if (filters.selectedSector !== 'ALL') {
        if (r.sector !== filters.selectedSector) return false;
      }

      // 3. Filtro por término de búsqueda (búsqueda rápida)
      if (filters.searchTerm.trim() !== '') {
        const term = filters.searchTerm.toLowerCase().trim();
        const matchesSector = r.sector.toLowerCase().includes(term);
        const matchesYear = r.year.toString().includes(term);
        if (!matchesSector && !matchesYear) return false;
      }

      return true;
    });
  }, [records, filters]);

  // Cálculo de KPIs según la selección activa
  const kpiMetrics = useMemo(() => {
    return computeKpiMetrics(records, filters.selectedYear, filters.selectedSector);
  }, [records, filters.selectedYear, filters.selectedSector]);

  // Generación de Hallazgos y Alertas
  const findings = useMemo(() => {
    return generateFindings(records, kpiMetrics, filters.selectedYear, filters.selectedSector);
  }, [records, kpiMetrics, filters.selectedYear, filters.selectedSector]);

  // Manejadores de actualización y reset de filtros
  const handleFilterChange = (updated: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFilters({
      selectedYear: 'ALL',
      selectedSector: 'ALL',
      indicatorType: 'ALL',
      searchTerm: '',
    });
  };

  // Manejador para solicitar una segunda opinión a Gemini
  const handleRequestSecondOpinion = async () => {
    setIsSecondOpinionOpen(true);
    setIsSecondOpinionLoading(true);
    setSecondOpinionError(null);
    try {
      const result = await requestSecondOpinion(filters, kpiMetrics, findings, records);
      setSecondOpinionData(result);
    } catch (err: any) {
      console.error('Error al pedir segunda opinión a Gemini:', err);
      setSecondOpinionError(err.message || 'No fue posible obtener la segunda opinión de Gemini.');
    } finally {
      setIsSecondOpinionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans">
      {/* 1. Header Institucional y de Conexión */}
      <Header
        metadata={metadata}
        isLoading={isRefreshing || isLoading}
        onRefresh={() => loadData(sourceMode)}
        onOpenAbout={() => setIsAboutOpen(true)}
        recordsCount={records.length}
      />

      {/* 2. Banner de Origen de Datos & Selector de API Datastore */}
      <div className="bg-slate-900/90 text-white border-b border-slate-800 py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-blue-500/20 text-blue-400">
              <Database className="w-3.5 h-3.5" />
            </span>
            <span className="text-slate-300">
              Modo de consulta API:
            </span>
            <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
              <button
                onClick={() => handleModeChange('CSV_FULL')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  sourceMode === 'CSV_FULL'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Descarga del recurso CSV oficial con 249 registros (2011–2025)"
              >
                Recurso CSV Oficial (249 registros, 2011–2025)
              </button>
              <button
                onClick={() => handleModeChange('DATASTORE_API')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  sourceMode === 'DATASTORE_API'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Consulta del endpoint datastore_search con 227 registros (2011–2024)"
              >
                API datastore_search (227 registros)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <span className="truncate max-w-xs md:max-w-md font-mono">
              {sourceMode === 'DATASTORE_API'
                ? 'api/3/action/datastore_search?resource_id=d884613c...'
                : 'Recurso oficial CSV: osb_enferaccidymortlaboral.csv'}
            </span>
            <button
              onClick={() => setIsAboutOpen(true)}
              className="text-blue-400 hover:text-blue-300 underline shrink-0"
            >
              Ver ficha técnica
            </button>
          </div>
        </div>
      </div>

      {/* 3. Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading && records.length === 0 ? (
          <LoadingState />
        ) : error && records.length === 0 ? (
          <ErrorState
            errorMessage={error}
            onRetry={() => loadData(sourceMode)}
            isRetrying={isLoading || isRefreshing}
          />
        ) : (
          <>
            {/* Mensaje de error no bloqueante si falló una recarga en segundo plano */}
            {error && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center justify-between">
                <span>
                  <strong>Aviso:</strong> No se pudo sincronizar en vivo ({error}). Mostrando los últimos datos oficiales cargados en memoria.
                </span>
                <button
                  onClick={() => setError(null)}
                  className="font-bold text-amber-700 hover:text-amber-900 ml-3"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Filtros Analíticos */}
            <Filters
              filters={filters}
              onChange={handleFilterChange}
              onReset={handleResetFilters}
              availableYears={availableYears}
              availableSectors={availableSectors}
              totalFilteredCount={filteredRecords.length}
              totalRecordsCount={records.length}
            />

            {/* Tarjetas KPI Principales y Complementarios */}
            <KpiCards
              metrics={kpiMetrics}
              selectedYear={filters.selectedYear}
              selectedSector={filters.selectedSector}
            />

            {/* Visualización Gráfica Recharts */}
            <ChartsSection
              records={filteredRecords}
              allRecords={records}
              selectedYear={filters.selectedYear}
              selectedSector={filters.selectedSector}
              indicatorType={filters.indicatorType}
            />

            {/* Panel de Hallazgos y Alertas Estadísticas */}
            <FindingsAlerts
              findings={findings}
              selectedYear={filters.selectedYear}
              onRequestSecondOpinion={handleRequestSecondOpinion}
              isSecondOpinionLoading={isSecondOpinionLoading}
            />

            {/* Tabla Detallada con Búsqueda, Ordenamiento y Exportación CSV */}
            <DataTable
              records={filteredRecords}
              totalCount={records.length}
            />
          </>
        )}
      </main>

      {/* 4. Footer Institucional */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-6 text-xs mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="font-semibold text-slate-300">
              Observatorio de Seguridad y Salud Laboral de Bogotá D. C.
            </p>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Proyecto académico de Business Intelligence para la prevención de riesgos laborales. Basado en datos abiertos de la Secretaría Distrital de Salud.
            </p>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setIsAboutOpen(true)}
              className="text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Ficha metodológica
            </button>
            <span className="text-slate-700">•</span>
            <a
              href="https://datosabiertos.bogota.gov.co/dataset/accidentalidad-enfermedad-y-mortalidad-laboral-en-bogota-d-c"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
            >
              Portal Datos Abiertos Bogotá
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

      {/* 5. Modal Acerca de los Datos */}
      <AboutDataModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        metadata={metadata}
        datastoreNotes={datastoreNotes}
      />

      {/* 6. Modal de Segunda Opinión Analítica de Gemini */}
      <GeminiSecondOpinionModal
        isOpen={isSecondOpinionOpen}
        onClose={() => setIsSecondOpinionOpen(false)}
        isLoading={isSecondOpinionLoading}
        error={secondOpinionError}
        opinion={secondOpinionData}
        onRetry={handleRequestSecondOpinion}
        selectedYear={filters.selectedYear}
        selectedSector={filters.selectedSector}
      />
    </div>
  );
}
