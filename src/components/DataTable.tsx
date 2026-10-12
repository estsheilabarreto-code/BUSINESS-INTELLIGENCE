import React, { useState, useMemo } from 'react';
import {
  Table as TableIcon,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileSpreadsheet,
} from 'lucide-react';
import { LaborRecord } from '../types/data';
import { formatNumber } from '../utils/calculations';

interface DataTableProps {
  records: LaborRecord[];
  totalCount: number;
}

type SortField =
  | 'year'
  | 'sector'
  | 'totalAfiliados'
  | 'accidentesCalificados'
  | 'tasaAccidentalidad'
  | 'totalMuertes'
  | 'tasaMortalidad'
  | 'tasaEnfermedad';

export const DataTable: React.FC<DataTableProps> = ({ records }) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sortField, setSortField] = useState<SortField>('year');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Manejador de ordenamiento
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  // Datos ordenados
  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [records, sortField, sortOrder]);

  // Paginación
  const totalPages = Math.ceil(sortedRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, currentPage, pageSize]);

  // Exportar a CSV
  const handleExportCsv = () => {
    const headers = [
      'Año',
      'Sector Económico',
      'Trabajadores Afiliados Dependientes',
      'Estudiantes',
      'Trabajadores Afiliados Independientes',
      'Total Afiliados',
      'Accidentes de Trabajo Calificados',
      'Enfermedades Calificadas',
      'Muertes por Accidentes de Trabajo',
      'Muertes por Enfermedad Laboral',
      'Total Muertes Laborales',
      'Tasa de Accidentalidad (%)',
      'Tasa de Mortalidad (por 100k)',
      'Tasa de Enfermedad Laboral (por 100k)',
    ];

    const rows = sortedRecords.map((r) => [
      r.year,
      `"${r.rawSector || r.sector}"`,
      r.afiliadosDependientes,
      r.estudiantes,
      r.afiliadosIndependientes,
      r.totalAfiliados,
      r.accidentesCalificados,
      r.enfermedadesCalificadas,
      r.muertesAccidentes,
      r.muertesEnfermedad,
      r.totalMuertes,
      r.tasaAccidentalidad,
      r.tasaMortalidad,
      r.tasaEnfermedad,
    ]);

    const csvContent = [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `observatorio_laboral_bogota_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 inline ml-1" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-blue-600 inline ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-600 inline ml-1" />
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden mb-8">
      {/* Header de la Tabla con controles */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
            <TableIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Registros Detallados del Conjunto Oficial
            </h3>
            <p className="text-xs text-slate-500">
              Datos procesados con validación numérica y tipos homogéneos ({records.length} registros)
            </p>
          </div>
        </div>

        {/* Acciones de exportación y tamaño de página */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span>Filas:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            title="Descargar conjunto filtrado en formato CSV compatible con Excel"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Tabla con scroll horizontal */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
            <tr>
              <th
                onClick={() => handleSort('year')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors group select-none whitespace-nowrap"
              >
                Año {renderSortIndicator('year')}
              </th>
              <th
                onClick={() => handleSort('sector')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors group select-none whitespace-nowrap min-w-[220px]"
              >
                Sector Económico {renderSortIndicator('sector')}
              </th>
              <th
                onClick={() => handleSort('totalAfiliados')}
                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors group select-none whitespace-nowrap"
              >
                Afiliados {renderSortIndicator('totalAfiliados')}
              </th>
              <th
                onClick={() => handleSort('accidentesCalificados')}
                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors group select-none whitespace-nowrap"
              >
                Accidentes {renderSortIndicator('accidentesCalificados')}
              </th>
              <th
                onClick={() => handleSort('tasaAccidentalidad')}
                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors group select-none whitespace-nowrap"
              >
                Tasa Accid. (%) {renderSortIndicator('tasaAccidentalidad')}
              </th>
              <th
                onClick={() => handleSort('totalMuertes')}
                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors group select-none whitespace-nowrap"
              >
                Muertes Totales {renderSortIndicator('totalMuertes')}
              </th>
              <th
                onClick={() => handleSort('tasaMortalidad')}
                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors group select-none whitespace-nowrap"
              >
                Tasa Mort. (x100k) {renderSortIndicator('tasaMortalidad')}
              </th>
              <th
                onClick={() => handleSort('tasaEnfermedad')}
                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors group select-none whitespace-nowrap"
              >
                Tasa Enf. (x100k) {renderSortIndicator('tasaEnfermedad')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  No se encontraron registros que coincidan con los filtros aplicados.
                </td>
              </tr>
            ) : (
              paginatedRecords.map((row) => (
                <tr
                  key={row.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    row.isTotalGeneral ? 'bg-blue-50/40 font-semibold' : ''
                  }`}
                >
                  <td className="py-2.5 px-4 text-slate-900 font-bold whitespace-nowrap">
                    {row.year}
                  </td>
                  <td className="py-2.5 px-4 text-slate-800 whitespace-nowrap max-w-xs truncate">
                    {row.isTotalGeneral ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-100/70 text-blue-800 text-[11px] font-bold">
                        ★ Total general (Distrito)
                      </span>
                    ) : (
                      row.sector
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-600 whitespace-nowrap">
                    {formatNumber(row.totalAfiliados)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-semibold text-slate-900 whitespace-nowrap">
                    {formatNumber(row.accidentesCalificados)}
                  </td>
                  <td className="py-2.5 px-4 text-right whitespace-nowrap font-bold text-blue-700">
                    {row.tasaAccidentalidad.toFixed(2)}%
                  </td>
                  <td className="py-2.5 px-4 text-right font-semibold text-rose-700 whitespace-nowrap">
                    {formatNumber(row.totalMuertes)}
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-700 whitespace-nowrap">
                    {row.tasaMortalidad.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-4 text-right text-purple-700 whitespace-nowrap">
                    {row.tasaEnfermedad.toFixed(1)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-600">
        <div>
          Mostrando página <span className="font-bold text-slate-900">{currentPage}</span> de{' '}
          <span className="font-bold text-slate-900">{totalPages}</span> ({sortedRecords.length} registros totales)
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-2 font-medium">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
