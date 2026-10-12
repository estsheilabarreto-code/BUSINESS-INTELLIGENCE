import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

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

// 1. Resource Metadata Endpoint
app.get('/api/datos-bogota/resource', async (_req, res) => {
  try {
    if (resourceCache && Date.now() - resourceCache.timestamp < CACHE_TTL_MS) {
      return res.json({ success: true, source: 'cache', result: resourceCache.data });
    }

    const response = await fetch(`${CKAN_BASE_URL}/resource_show?id=${RESOURCE_ID}`, {
      headers: { 'User-Agent': 'ObservatorioSeguridadLaboralBogota/1.0' }
    });

    if (!response.ok) {
      throw new Error(`Error en API CKAN: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data.success && data.result) {
      resourceCache = { data: data.result, timestamp: Date.now() };
    }

    res.json(data);
  } catch (error: any) {
    console.error('Error fetching resource metadata:', error);
    if (resourceCache) {
      return res.json({ success: true, source: 'stale-cache', result: resourceCache.data, warning: error.message });
    }
    res.status(502).json({ success: false, error: error.message || 'No se pudo consultar los metadatos de la API CKAN' });
  }
});

// 2. Datastore Search Endpoint
app.get('/api/datos-bogota/datastore', async (req, res) => {
  try {
    const limit = req.query.limit || '1000';
    if (datastoreCache && Date.now() - datastoreCache.timestamp < CACHE_TTL_MS) {
      return res.json({ success: true, source: 'cache', result: datastoreCache.data });
    }

    const response = await fetch(`${CKAN_BASE_URL}/datastore_search?resource_id=${RESOURCE_ID}&limit=${limit}`, {
      headers: { 'User-Agent': 'ObservatorioSeguridadLaboralBogota/1.0' }
    });

    if (!response.ok) {
      throw new Error(`Error en Datastore CKAN: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data.success && data.result) {
      datastoreCache = { data: data.result, timestamp: Date.now() };
    }

    res.json(data);
  } catch (error: any) {
    console.error('Error fetching datastore records:', error);
    if (datastoreCache) {
      return res.json({ success: true, source: 'stale-cache', result: datastoreCache.data, warning: error.message });
    }
    res.status(502).json({ success: false, error: error.message || 'No se pudo consultar el datastore de Bogotá' });
  }
});

// 3. Raw CSV download and normalized data endpoint
app.get('/api/datos-bogota/csv', async (_req, res) => {
  try {
    if (csvCache && Date.now() - csvCache.timestamp < CACHE_TTL_MS) {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      return res.send(csvCache.rawText);
    }

    // Attempt to get dynamic CSV url from metadata, fallback to default
    let csvUrl = DEFAULT_CSV_URL;
    try {
      const metaRes = await fetch(`${CKAN_BASE_URL}/resource_show?id=${RESOURCE_ID}`);
      const metaData = await metaRes.json();
      if (metaData?.result?.url) {
        csvUrl = metaData.result.url;
      }
    } catch (e) {
      console.warn('Could not refresh resource metadata, using default CSV URL', e);
    }

    const csvResponse = await fetch(csvUrl, {
      headers: { 'User-Agent': 'ObservatorioSeguridadLaboralBogota/1.0' }
    });

    if (!csvResponse.ok) {
      throw new Error(`Error al descargar archivo CSV: ${csvResponse.status} ${csvResponse.statusText}`);
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
    console.error('Error fetching CSV:', error);
    if (csvCache) {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      return res.send(csvCache.rawText);
    }
    res.status(502).json({ success: false, error: error.message || 'Error al obtener CSV oficial' });
  }
});

// 4. Complete Unified JSON data endpoint (Metadata + Parsed records)
app.get('/api/datos-bogota/unified', async (_req, res) => {
  try {
    let metadata: any = null;
    let csvUrl = DEFAULT_CSV_URL;

    // Fetch or use cached metadata
    try {
      if (resourceCache && Date.now() - resourceCache.timestamp < CACHE_TTL_MS) {
        metadata = resourceCache.data;
      } else {
        const metaRes = await fetch(`${CKAN_BASE_URL}/resource_show?id=${RESOURCE_ID}`);
        const metaData = await metaRes.json();
        if (metaData.success && metaData.result) {
          metadata = metaData.result;
          resourceCache = { data: metadata, timestamp: Date.now() };
          if (metadata.url) csvUrl = metadata.url;
        }
      }
    } catch (e: any) {
      console.warn('Warning getting metadata:', e.message);
    }

    // Fetch and parse CSV
    let csvText = '';
    if (csvCache && Date.now() - csvCache.timestamp < CACHE_TTL_MS) {
      csvText = csvCache.rawText;
    } else {
      const csvRes = await fetch(csvUrl);
      if (!csvRes.ok) throw new Error(`HTTP ${csvRes.status} al descargar CSV`);
      const buf = await csvRes.arrayBuffer();
      csvText = decodeBuffer(buf);
      csvCache = { rawText: csvText, records: [], timestamp: Date.now() };
    }

    const parsed = Papa.parse(csvText, {
      header: true,
      delimiter: ';',
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    });

    res.json({
      success: true,
      metadata: metadata || {
        id: RESOURCE_ID,
        name: 'Tasa de accidentalidad laboral en Bogotá',
        url: csvUrl,
        last_modified: new Date().toISOString(),
      },
      fields: parsed.meta.fields,
      totalRecords: parsed.data.length,
      records: parsed.data,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching unified dataset:', error);
    res.status(502).json({ success: false, error: error.message || 'Error al procesar el conjunto de datos unificado' });
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
