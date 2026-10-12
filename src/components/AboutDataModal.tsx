import React from 'react';
import {
  X,
  Database,
  ExternalLink,
  BookOpen,
  Calendar,
  AlertCircle,
  FileCheck2,
  Code2,
  Layers,
} from 'lucide-react';
import { ResourceMetadata } from '../types/data';

interface AboutDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: ResourceMetadata | null;
  datastoreNotes?: string;
}

export const AboutDataModal: React.FC<AboutDataModalProps> = ({
  isOpen,
  onClose,
  metadata,
  datastoreNotes,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header del Modal */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Acerca de los Datos y Transparencia Metodológica
              </h3>
              <p className="text-xs text-slate-500">
                Ficha técnica oficial, origen de datos abiertos y definiciones de cálculo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido del Modal */}
        <div className="p-6 space-y-6 text-xs text-slate-600 leading-relaxed">
          {/* 1. Fuente y Entidad Responsable */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                Entidad Responsable
              </span>
              <p className="font-bold text-slate-900 text-sm">
                Alcaldía Mayor de Bogotá D. C.
              </p>
              <p className="text-slate-600 mt-0.5">
                Secretaría Distrital de Salud • Observatorio Distrital de Salud (SaluData)
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                Plataforma y Licencia
              </span>
              <p className="font-bold text-slate-900 text-sm">
                Portal de Datos Abiertos de Bogotá
              </p>
              <p className="text-slate-600 mt-0.5">
                Basado en CKAN v3 • Datos Abiertos del Gobierno Distrital de Colombia
              </p>
            </div>
          </div>

          {/* 2. Identificadores Oficiales y Endpoints de Consulta */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
              <Code2 className="w-4 h-4 text-blue-600" />
              Identificadores Oficiales y Endpoints de la API CKAN
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="bg-white p-2.5 rounded border border-slate-200">
                <span className="text-slate-400 block font-sans font-semibold text-[10px]">
                  ID del Conjunto (Dataset):
                </span>
                <span className="text-blue-700 select-all">2105fc35-6e17-4e9c-a183-391eb8719cec</span>
              </div>
              <div className="bg-white p-2.5 rounded border border-slate-200">
                <span className="text-slate-400 block font-sans font-semibold text-[10px]">
                  ID del Recurso (Resource):
                </span>
                <span className="text-blue-700 select-all">d884613c-911c-44c4-89f0-b2f8bda862c6</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1 text-[11px]">
              <div>
                <strong className="text-slate-700">Endpoint Datastore Search:</strong>
                <code className="block bg-white p-2 rounded border border-slate-200 text-slate-800 break-all mt-0.5 font-mono text-[10px]">
                  https://datosabiertos.bogota.gov.co/api/3/action/datastore_search?resource_id=d884613c-911c-44c4-89f0-b2f8bda862c6
                </code>
              </div>
              <div>
                <strong className="text-slate-700">Endpoint Metadatos de Recurso:</strong>
                <code className="block bg-white p-2 rounded border border-slate-200 text-slate-800 break-all mt-0.5 font-mono text-[10px]">
                  https://datosabiertos.bogota.gov.co/api/3/action/resource_show?id=d884613c-911c-44c4-89f0-b2f8bda862c6
                </code>
              </div>
            </div>

            {datastoreNotes && (
              <p className="text-[11px] text-slate-500 italic pt-1">
                {datastoreNotes}
              </p>
            )}
          </div>

          {/* 3. Variables y Metodología de Tasas Oficiales */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs mb-2 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-600" />
              Definición de Variables y Metodología Oficial
            </h4>
            <div className="space-y-2 border-l-2 border-blue-500 pl-3">
              <p>
                <strong>Tasa de accidentalidad laboral:</strong> Calculada oficialmente como el número de accidentes de trabajo calificados por cada 100 trabajadores afiliados al Sistema General de Riesgos Laborales (SGRL) durante el periodo de referencia.
              </p>
              <p>
                <strong>Tasa de mortalidad ATEL:</strong> Expresa el número de muertes laborales calificadas (por accidentes y por enfermedad) por cada 100.000 trabajadores afiliados al SGRL.
              </p>
              <p>
                <strong>Tasa de enfermedad laboral -ATEL-:</strong> Número de enfermedades laborales calificadas en firme por cada 100.000 trabajadores afiliados.
              </p>
              <p>
                <strong>Total de muertes laborales:</strong> Suma de las muertes reportadas por accidentes de trabajo calificadas y las muertes por enfermedad laboral calificadas, como eventos mutuamente excluyentes.
              </p>
            </div>
          </div>

          {/* 4. Limitaciones del Conjunto de Datos */}
          <div className="bg-amber-50/80 rounded-xl p-4 border border-amber-200 text-amber-900 space-y-1.5">
            <h4 className="font-bold text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700" />
              Limitaciones y Consideraciones Técnicas
            </h4>
            <ul className="list-disc list-inside space-y-1 text-[11px]">
              <li>
                <strong>Cobertura:</strong> Los datos registran únicamente a trabajadores afiliados formalmente al SGRL (dependientes, independientes cotizantes y estudiantes en prácticas formativas). No representan la informalidad laboral no afiliada.
              </li>
              <li>
                <strong>Tiempos de calificación:</strong> La calificación de enfermedades laborales puede conllevar tiempos de dictamen ante las Juntas Regionales y Nacionales de Calificación de Invalidez, lo que puede generar concentraciones temporales retrospectivas.
              </li>
              <li>
                <strong>Cambios de codificación sectorial:</strong> Entre 2011 y 2022 los sectores se agruparon bajo divisiones CIIU clásicas; a partir de 2023 se adoptaron las nomenclaturas detalladas de la Clasificación Industrial Internacional Uniforme (CIIU Rev. 4 A.C.).
              </li>
            </ul>
          </div>

          {/* 5. Vínculo oficial */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-slate-400 text-[11px]">
              Consulta: {metadata?.fetchedAt ? new Date(metadata.fetchedAt).toLocaleString('es-CO') : 'Reciente'}
            </span>
            <a
              href="https://datosabiertos.bogota.gov.co/dataset/accidentalidad-enfermedad-y-mortalidad-laboral-en-bogota-d-c"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors"
            >
              <span>Ver dataset en Datos Abiertos Bogotá</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
