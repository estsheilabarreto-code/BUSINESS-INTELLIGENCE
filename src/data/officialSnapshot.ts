import officialRecords from './official_records.json';
import type { RawLaborRecord } from '../types/data';

/**
 * Repositorio Oficial Validado del Conjunto de Datos Abiertos de Bogotá
 * Recurso CKAN ID: d884613c-911c-44c4-89f0-b2f8bda862c6
 * Conjunto ID: 2105fc35-6e17-4e9c-a183-391eb8719cec
 * Secretaría Distrital de Salud - SDS / Alcaldía Mayor de Bogotá D.C.
 *
 * Utilizado para garantizar alta disponibilidad cuando el servidor externo
 * datosabiertos.bogota.gov.co experimenta tiempo de espera (timeout) o mantenimiento.
 */
export const OFFICIAL_BOGOTA_RAW_RECORDS: RawLaborRecord[] = officialRecords as unknown as RawLaborRecord[];
