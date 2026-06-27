import { Platform } from 'react-native'

import { EquipmentRequestItem, StudentAttendee } from '@types'

export type OfflineFieldtripData = {
  fieldtripId: number
  fieldtripName: string
  downloadedAt: string
  downloadedByUserId: number | null
  attendees: StudentAttendee[]
  equipmentRequests: EquipmentRequestItem[]
  equipmentByUser: Record<number, { id: number; quantity: number }[]>
  healthByUser: Record<number, OfflineHealthData>
}

export type OfflineHealthConstant = {
  fullName: string
  bloodType: string
  medAllergies: string[]
  substanceAllergies: string[]
  emergencyContact: {
    name: string
    phone: string
  }
  preferredMedicalInstitution: string | null
}

export type OfflineHealthItem = {
  item: string
  value: string
}

export type OfflineHealthFieldtrip = {
  inTreatmentFor: string
  takingMeds: string
  hasPresented: string[]
  presents: string[]
  healthSpecific: OfflineHealthItem[]
}

export type OfflineHealthData = {
  constant: OfflineHealthConstant | null
  fieldtrip: OfflineHealthFieldtrip | null
}

export type OfflineFieldtripSummary = {
  fieldtripId: number
  fieldtripName: string
  downloadedAt: string
  attendeesCount: number
  equipmentRequestsCount: number
}

const DATABASE_NAME = 'fieldtrip_offline.db'
const TABLE_NAME = 'fieldtrip_offline_data'
const HEALTH_LOG_QUEUE_TABLE = 'health_log_queue'

type SQLiteModule = typeof import('expo-sqlite')

let sqliteModule: SQLiteModule | null = null
let dbPromise: Promise<SQLiteModule['SQLiteDatabase']> | null = null

const getSQLite = async () => {
  if (Platform.OS === 'web') {
    return null
  }

  if (!sqliteModule) {
    sqliteModule = await import('expo-sqlite')
  }

  return sqliteModule
}

const getDatabase = async () => {
  const sqlite = await getSQLite()
  if (!sqlite?.openDatabaseAsync) {
    return null
  }

  if (!dbPromise) {
    dbPromise = sqlite.openDatabaseAsync(DATABASE_NAME)
  }

  return dbPromise
}

export const initOfflineDb = async () => {
  const db = await getDatabase()
  if (!db) {
    return
  }

  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      fieldtrip_id INTEGER PRIMARY KEY NOT NULL,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,
  )

  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS ${HEALTH_LOG_QUEUE_TABLE} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL
    );`,
  )
}

export const saveFieldtripOfflineData = async (payload: OfflineFieldtripData) => {
  const serialized = JSON.stringify(payload)
  const db = await getDatabase()
  if (!db) {
    return
  }

  await db.runAsync(
    `INSERT OR REPLACE INTO ${TABLE_NAME} (fieldtrip_id, data, updated_at) VALUES (?, ?, ?);`,
    [payload.fieldtripId, serialized, payload.downloadedAt],
  )
}

export const getFieldtripOfflineData = async (
  fieldtripId: number,
): Promise<OfflineFieldtripData | null> => {
  const db = await getDatabase()
  if (!db) {
    return null
  }

  const rows = await db.getAllAsync<{ data: string }>(
    `SELECT data FROM ${TABLE_NAME} WHERE fieldtrip_id = ? LIMIT 1;`,
    [fieldtripId],
  )

  if (rows.length === 0) {
    return null
  }

  const row = rows[0]
  if (!row?.data) {
    return null
  }

  try {
    return JSON.parse(row.data) as OfflineFieldtripData
  } catch (error) {
    console.warn('No se pudo leer la data offline de la salida:', error)
    return null
  }
}

export const listOfflineFieldtrips = async (): Promise<OfflineFieldtripSummary[]> => {
  const db = await getDatabase()
  if (!db) {
    return []
  }

  const rows = await db.getAllAsync<{ data: string }>(
    `SELECT data FROM ${TABLE_NAME} ORDER BY updated_at DESC;`,
  )

  return rows
    .map((row) => {
      try {
        const parsed = JSON.parse(row.data) as OfflineFieldtripData
        return {
          fieldtripId: parsed.fieldtripId,
          fieldtripName: parsed.fieldtripName,
          downloadedAt: parsed.downloadedAt,
          attendeesCount: parsed.attendees?.length || 0,
          equipmentRequestsCount: parsed.equipmentRequests?.length || 0,
        }
      } catch (error) {
        console.warn('No se pudo leer el resumen offline:', error)
        return null
      }
    })
    .filter(Boolean) as OfflineFieldtripSummary[]
}

export type HealthLogQueueItem = {
  id: number
  payload: {
    viewer_id: number
    owner: number
    fieldtrip_id: number
  }
  createdAt: string
}

export const enqueueHealthLogView = async (payload: {
  viewer_id: number
  owner: number
  fieldtrip_id: number
}) => {
  const db = await getDatabase()
  if (!db) {
    return
  }

  await db.runAsync(`INSERT INTO ${HEALTH_LOG_QUEUE_TABLE} (payload, created_at) VALUES (?, ?);`, [
    JSON.stringify(payload),
    new Date().toISOString(),
  ])
}

export const listHealthLogQueue = async (): Promise<HealthLogQueueItem[]> => {
  const db = await getDatabase()
  if (!db) {
    return []
  }

  const rows = await db.getAllAsync<{ id: number; payload: string; created_at: string }>(
    `SELECT id, payload, created_at FROM ${HEALTH_LOG_QUEUE_TABLE} ORDER BY created_at ASC;`,
  )

  return rows
    .map((row: { id: any; payload: string; created_at: any }) => {
      try {
        return {
          id: row.id,
          payload: JSON.parse(row.payload) as HealthLogQueueItem['payload'],
          createdAt: row.created_at,
        }
      } catch (error) {
        console.warn('No se pudo leer la cola de salud:', error)
        return null
      }
    })
    .filter(Boolean) as HealthLogQueueItem[]
}

export const deleteHealthLogQueueItem = async (id: number) => {
  const db = await getDatabase()
  if (!db) {
    return
  }

  await db.runAsync(`DELETE FROM ${HEALTH_LOG_QUEUE_TABLE} WHERE id = ?;`, [id])
}

export const deleteFieldtripOfflineData = async (fieldtripId: number) => {
  const db = await getDatabase()
  if (!db) {
    return
  }

  await db.runAsync(`DELETE FROM ${TABLE_NAME} WHERE fieldtrip_id = ?;`, [fieldtripId])
}

export const isFieldtripOfflineSaved = async (fieldtripId: number): Promise<boolean> => {
  const db = await getDatabase()
  if (!db) {
    return false
  }

  const rows = await db.getAllAsync<{ fieldtrip_id: number }>(
    `SELECT fieldtrip_id FROM ${TABLE_NAME} WHERE fieldtrip_id = ? LIMIT 1;`,
    [fieldtripId],
  )

  return rows.length > 0
}
