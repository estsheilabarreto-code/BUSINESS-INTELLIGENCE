import React from 'react';
import { Loader2, Database, ShieldAlert } from 'lucide-react';

export const LoadingState: React.FC = () => {
  return (
    <div className="min-h-[500px] flex flex-col items-center justify-center p-8 bg-slate-50/50">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md w-full text-center">
        <div className="relative inline-block mb-4">
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-blue-600 inline-block animate-pulse">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin absolute -top-1 -right-1" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-1">
          Consultando Fuente Oficial de Bogotá
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Conectando con la API CKAN y el portal de Datos Abiertos de Bogotá D. C.
        </p>

        <div className="space-y-3 text-left bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
          <div className="flex items-center gap-2.5 text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Endpoint: datastore_search & resource_show</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-700">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            <span>Descargando y normalizando indicadores 2011–2025...</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            <span>Computando KPIs y variaciones porcentuales</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 mt-5 italic">
          Sin datos simulados ni aproximaciones ficticias
        </p>
      </div>
    </div>
  );
};
