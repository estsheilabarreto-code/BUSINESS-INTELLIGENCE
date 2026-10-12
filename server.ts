import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Cache in memory to ensure fast responses and resilience
let resourceCache: { data: any; timestamp: number } | null = null;
let csvCache: { rawText: string; records: any[]; timestamp: number } | null = null;
let datastoreCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

const RESOURCE_ID = 'd884613c-911c-44c4-89f0-b2f8bda862c6';
const DATASET_ID = '2105fc35-6e17-4e9c-a183-391eb8719cec';
const CKAN_BASE_URL = 'https://datosabiertos.bogota.gov.co/api/3/action';
const DEFAULT_CSV_URL = `https://datosabiertos.bogota.gov.co/dataset/${DATASET_ID}/resource/${RESOURCE_ID}/download/osb_enferaccidymortlaboral.csv`;

app.use(express.json());

import fs from 'fs';

const officialJsonPath = path.resolve(__dirname, 'src/data/official_records.json');
let OFFICIAL_BOGOTA_RAW_RECORDS: any[] = [];
try {
  OFFICIAL_BOGOTA_RAW_RECORDS = JSON.parse(fs.readFileSync(officialJsonPath, 'utf-8'));
} catch (e: any) {
  console.error('Error cargando official_records.json:', e.message);
}

// Helper function to decode latin1/utf8 safely
function decodeBuffer(buf: ArrayBuffer): string {
  try {
    const utf8Dec = new TextDecoder('utf-8', { fatal: true });
    return utf8Dec.decode(buf);
  } catch {
    const latin1Dec = new TextDecoder('latin1');
    return latin1Dec.decode(buf);
  }
}

// Fetch with strict timeout to prevent 10s hang when external government portal is down
async function fetchWithShortTimeout(url: string, options: RequestInit = {}, timeoutMs = 2500): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

// 1. Resource Metadata Endpoint
app.get('/api/datos-bogota/resource', async (_req, res) => {
  try {
    if (resourceCache && Date.now() - resourceCache.timestamp < CACHE_TTL_MS) {
      return res.json({ success: true, source: 'cache', result: resourceCache.data });
    }

    const response = await fetchWithShortTimeout(`${CKAN_BASE_URL}/resource_show?id=${RESOURCE_ID}`, {
      headers: { 'User-Agent': 'ObservatorioSeguridadLaboralBogota/1.0' }
    }, 2500);

    if (!response.ok) {
      throw new Error(`Error en API CKAN: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data.success && data.result) {
      resourceCache = { data: data.result, timestamp: Date.now() };
    }

    res.json(data);
  } catch (error: any) {
    console.warn('Portal CKAN de Bogotá no disponible (timeout/offline), sirviendo metadatos oficiales de contingencia:', error.message);
    const fallbackMetadata = {
      id: RESOURCE_ID,
      name: 'Tasa de accidentalidad laboral en Bogotá',
      url: DEFAULT_CSV_URL,
      last_modified: '2026-02-20T16:39:15.950225',
      format: 'CSV',
      datastore_active: true,
      contingency: true,
      notice: 'Servidor externo de Datos Abiertos Bogotá con tiempo de espera. Operando con metadatos oficiales en repositorio.',
    };
    res.json({ success: true, source: 'official-contingency-snapshot', result: fallbackMetadata });
  }
});

// 2. Datastore Search Endpoint
app.get('/api/datos-bogota/datastore', async (req, res) => {
  try {
    const limit = req.query.limit || '1000';
    if (datastoreCache && Date.now() - datastoreCache.timestamp < CACHE_TTL_MS) {
      return res.json({ success: true, source: 'cache', result: datastoreCache.data });
    }

    const response = await fetchWithShortTimeout(`${CKAN_BASE_URL}/datastore_search?resource_id=${RESOURCE_ID}&limit=${limit}`, {
      headers: { 'User-Agent': 'ObservatorioSeguridadLaboralBogota/1.0' }
    }, 2500);

    if (!response.ok) {
      throw new Error(`Error en Datastore CKAN: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data.success && data.result) {
      datastoreCache = { data: data.result, timestamp: Date.now() };
    }

    res.json(data);
  } catch (error: any) {
    console.warn('Datastore de Bogotá no disponible (timeout/offline), sirviendo registros oficiales validados:', error.message);
    // Filtrar hasta 2024 para simular exactamente el alcance del datastore oficial (2011-2024)
    const datastoreRecords = OFFICIAL_BOGOTA_RAW_RECORDS.filter(r => parseInt(r['Año'] || '0', 10) <= 2024);
    res.json({
      success: true,
      source: 'official-contingency-snapshot',
      result: {
        total: datastoreRecords.length,
        records: datastoreRecords,
        fields: Object.keys(OFFICIAL_BOGOTA_RAW_RECORDS[0] || {}).map(id => ({ id, type: 'text' })),
      },
    });
  }
});

// 3. Raw CSV download endpoint
app.get('/api/datos-bogota/csv', async (_req, res) => {
  try {
    if (csvCache && Date.now() - csvCache.timestamp < CACHE_TTL_MS) {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      return res.send(csvCache.rawText);
    }

    const csvResponse = await fetchWithShortTimeout(DEFAULT_CSV_URL, {
      headers: { 'User-Agent': 'ObservatorioSeguridadLaboralBogota/1.0' }
    }, 2500);

    if (!csvResponse.ok) {
      throw new Error(`Error al descargar CSV: ${csvResponse.status}`);
    }

    const buf = await csvResponse.arrayBuffer();
    const text = decodeBuffer(buf);

    csvCache = {
      rawText: text,
      records: [],
      timestamp: Date.now()
    };

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.send(text);
  } catch (error: any) {
    console.warn('Descarga en vivo de CSV no disponible (timeout), generando CSV a partir del repositorio oficial:', error.message);
    const headers = Object.keys(OFFICIAL_BOGOTA_RAW_RECORDS[0] || {});
    const rows = OFFICIAL_BOGOTA_RAW_RECORDS.map(r => headers.map(h => `"${r[h] || ''}"`).join(';'));
    const csvContent = [headers.join(';'), ...rows].join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.send(csvContent);
  }
});

let portalOfflineUntil = 0;

// 4. Complete Unified JSON data endpoint (Metadata + Parsed records)
app.get('/api/datos-bogota/unified', async (_req, res) => {
  try {
    let metadata: any = null;
    let csvText = '';

    // Si el portal externo ya falló recientemente, no esperar timeouts innecesarios
    const isPortalKnownOffline = Date.now() < portalOfflineUntil;

    if (!isPortalKnownOffline) {
      // Intentar consulta en vivo con tiempo límite corto
      try {
        const metaRes = await fetchWithShortTimeout(`${CKAN_BASE_URL}/resource_show?id=${RESOURCE_ID}`, {}, 1500);
        if (metaRes.ok) {
          const metaData = await metaRes.json();
          if (metaData?.success && metaData.result) {
            metadata = metaData.result;
            resourceCache = { data: metadata, timestamp: Date.now() };
          }
        }
      } catch {
        portalOfflineUntil = Date.now() + 3 * 60 * 1000;
      }

      try {
        const csvRes = await fetchWithShortTimeout(DEFAULT_CSV_URL, {}, 1800);
        if (csvRes.ok) {
          const buf = await csvRes.arrayBuffer();
          csvText = decodeBuffer(buf);
          csvCache = { rawText: csvText, records: [], timestamp: Date.now() };
        }
      } catch {
        portalOfflineUntil = Date.now() + 3 * 60 * 1000;
      }
    }

    // Si se obtuvo texto en vivo, parsearlo
    if (csvText) {
      const parsed = Papa.parse(csvText, {
        header: true,
        delimiter: ';',
        skipEmptyLines: true,
        transformHeader: (h) => h.trim(),
      });

      return res.json({
        success: true,
        source: 'LIVE_PORTAL',
        metadata: metadata || {
          id: RESOURCE_ID,
          name: 'Tasa de accidentalidad laboral en Bogotá',
          url: DEFAULT_CSV_URL,
          last_modified: '2026-02-20T16:39:15.950225',
        },
        fields: parsed.meta.fields,
        totalRecords: parsed.data.length,
        records: parsed.data,
        fetchedAt: new Date().toISOString(),
      });
    }

    // Si el portal externo está en timeout/offline, servir inmediatamente el snapshot oficial validado
    console.info('Portal de Bogotá en timeout: entregando repositorio oficial validado de 2011–2025.');
    const fields = Object.keys(OFFICIAL_BOGOTA_RAW_RECORDS[0] || {});

    res.json({
      success: true,
      source: 'OFFICIAL_SNAPSHOT_CONTINGENCY',
      metadata: metadata || {
        id: RESOURCE_ID,
        name: 'Tasa de accidentalidad laboral en Bogotá',
        url: DEFAULT_CSV_URL,
        last_modified: '2026-02-20T16:39:15.950225',
        contingency: true,
      },
      fields,
      totalRecords: OFFICIAL_BOGOTA_RAW_RECORDS.length,
      records: OFFICIAL_BOGOTA_RAW_RECORDS,
      fetchedAt: new Date().toISOString(),
      notice: 'Servidor externo de Bogotá en mantenimiento/tiempo de espera excedido. Operando con el repositorio oficial validado de la Secretaría Distrital de Salud.',
    });
  } catch (error: any) {
    console.error('Error crítico en endpoint unified, entregando respaldo oficial directo:', error);
    res.json({
      success: true,
      source: 'OFFICIAL_SNAPSHOT_CONTINGENCY',
      metadata: {
        id: RESOURCE_ID,
        name: 'Tasa de accidentalidad laboral en Bogotá',
        url: DEFAULT_CSV_URL,
        last_modified: '2026-02-20T16:39:15.950225',
      },
      fields: Object.keys(OFFICIAL_BOGOTA_RAW_RECORDS[0] || {}),
      totalRecords: OFFICIAL_BOGOTA_RAW_RECORDS.length,
      records: OFFICIAL_BOGOTA_RAW_RECORDS,
      fetchedAt: new Date().toISOString(),
    });
  }
});

// 5. Endpoint de Segunda Opinión Analítica con Gemini
app.post('/api/gemini/second-opinion', async (req, res) => {
  try {
    const { context } = req.body;
    if (!context) {
      return res.status(400).json({ success: false, error: 'Contexto analítico no proporcionado.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'No se encuentra configurada la clave GEMINI_API_KEY en el entorno.',
      });
    }

    const promptText = `
Eres un consultor senior especializado en Business Intelligence, Epidemiología Ocupacional y Gestión de Seguridad y Salud en el Trabajo (SG-SST) para Bogotá D. C.

El usuario está consultando el "Observatorio de Seguridad y Salud Laboral de Bogotá" y solicita una "SEGUNDA OPINIÓN" analítica e independiente basada EXCLUSIVAMENTE en los datos e indicadores reales actualmente visibles en pantalla.

CONTEXTO ACTUAL DEL OBSERVATORIO (DATOS OFICIALES REALES):
- Filtro de Año activo: ${context.selectedYear === 'ALL' ? 'Serie histórica completa (2011 a 2025)' : 'Año ' + context.selectedYear}
- Filtro de Sector activo: ${context.selectedSector === 'ALL' ? 'Total general distrital consolidado' : context.selectedSector}
- Tipo de indicador seleccionado: ${context.indicatorType}

MÉTRICAS Y RESULTADOS DEL CONTEXTO:
- Tasa oficial de accidentalidad: ${context.metrics?.tasaAccidentalidad}% por cada 100 afiliados (Variación vs año previo: ${context.metrics?.tasaAccidentalidadVar?.label || 'N/A'})
- Accidentes calificados absolutos: ${context.metrics?.totalAccidentes?.toLocaleString('es-CO')} casos (Variación: ${context.metrics?.totalAccidentesVar?.label || 'N/A'})
- Muertes laborales validadas totales: ${context.metrics?.totalMuertes?.toLocaleString('es-CO')} (Por accidentes: ${context.metrics?.muertesAccidentes?.toLocaleString('es-CO')}, Por enfermedad laboral: ${context.metrics?.muertesEnfermedad?.toLocaleString('es-CO')})
- Tasa oficial de mortalidad: ${context.metrics?.tasaMortalidad} por cada 100.000 afiliados (Variación: ${context.metrics?.tasaMortalidadVar?.label || 'N/A'})
- Total enfermedades laborales calificadas: ${context.metrics?.totalEnfermedades?.toLocaleString('es-CO')} (Variación: ${context.metrics?.totalEnfermedadesVar?.label || 'N/A'})
- Tasa oficial de enfermedad laboral -ATEL-: ${context.metrics?.tasaEnfermedad} por cada 100.000 afiliados
- Población trabajadora afiliada total: ${context.metrics?.totalAfiliados?.toLocaleString('es-CO')} (Dependientes: ${context.metrics?.afiliadosDependientes?.toLocaleString('es-CO')}, Independientes: ${context.metrics?.afiliadosIndependientes?.toLocaleString('es-CO')}, Estudiantes: ${context.metrics?.estudiantes?.toLocaleString('es-CO')})

TOP SECTORES RELEVANTES EN EL CONTEXTO:
${JSON.stringify(context.topSectors || [], null, 2)}

HALLAZGOS PREVIOS DEL SISTEMA:
${JSON.stringify(context.currentFindings?.map((f: any) => ({ titulo: f.title, dato: f.dataPoint, criterio: f.criterion })) || [], null, 2)}

INSTRUCCIONES OBLIGATORIAS:
Debes analizar con rigor técnico la información anterior y proponer una ACCIÓN ALTERNATIVA O COMPLEMENTARIA a los hallazgos ya emitidos.
Responde estrictamente con un JSON que contenga exactamente los siguientes 6 campos:
1. "hallazgoIdentificado": Describe con precisión técnica el hallazgo analítico o situación observada más relevante que sustenta tu segunda opinión.
2. "accionPropuesta": Formula una acción concreta, viable, alternativa o complementaria relacionada directamente con los resultados observados para reducir riesgos o mejorar la gestión preventiva.
3. "datosQueRespaldan": Arreglo de strings con las cifras exactas e indicadores específicos del Observatorio que sustentan la recomendación.
4. "justificacion": Explica por qué recomiendas esa acción, qué problema u oportunidad busca atender y por qué se diferencia o complementa las medidas estándar.
5. "resultadoEsperado": Describe brevemente qué se espera conseguir al implementar la acción, sin garantizar resultados que no puedan demostrarse con los datos disponibles.
6. "limitaciones": Señala con honestidad las limitaciones del análisis (ej. cobertura restringida al SGRL formal contributivo, sin cobertura de informalidad laboral no afiliada, posibles rezagos en calificación de juntas, etc.). Evita inventar cifras o conclusiones no soportadas.
`;

    // Intentar invocar con @google/genai SDK
    let jsonResponse: any = null;

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptText,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              hallazgoIdentificado: { type: Type.STRING },
              accionPropuesta: { type: Type.STRING },
              datosQueRespaldan: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              justificacion: { type: Type.STRING },
              resultadoEsperado: { type: Type.STRING },
              limitaciones: { type: Type.STRING },
            },
            required: [
              'hallazgoIdentificado',
              'accionPropuesta',
              'datosQueRespaldan',
              'justificacion',
              'resultadoEsperado',
              'limitaciones',
            ],
          },
        },
      });

      const text = response.text;
      if (text) {
        const cleaned = text.trim().replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
        jsonResponse = JSON.parse(cleaned);
      }
    } catch (sdkError: any) {
      console.warn('Fallo SDK primario, intentando endpoint directo REST:', sdkError.message);
      // Fallback directo a endpoint REST oficial de Gemini
      const restRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: {
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (!restRes.ok) {
        throw new Error(`Error en API Gemini REST: ${restRes.status} ${restRes.statusText}`);
      }

      const restJson = await restRes.json();
      const rawText = restJson.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('No se recibió texto de respuesta de Gemini.');
      const cleanedRaw = rawText.trim().replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
      jsonResponse = JSON.parse(cleanedRaw);
    }

    if (!jsonResponse) {
      throw new Error('No fue posible estructurar la segunda opinión de Gemini.');
    }

    res.json({
      success: true,
      opinion: {
        ...jsonResponse,
        metadata: {
          analyzedYear: context.selectedYear,
          analyzedSector: context.selectedSector,
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (error: any) {
    console.error('Error generando segunda opinión con Gemini:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'No fue posible generar la segunda opinión en este momento.',
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Observatorio Server corriendo en http://0.0.0.0:${PORT} [${isProduction ? 'PROD' : 'DEV'}]`);
  });
}

startServer();
