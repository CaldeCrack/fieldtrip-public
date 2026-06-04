import { Platform } from 'react-native'

import { EquipmentRequestItem, StudentAttendee } from '@types'

export type OfflineFieldtripData = {
  fieldtripId: number
  fieldtripName: string
  downloadedAt: string
  attendees: StudentAttendee[]
  equipmentRequests: EquipmentRequestItem[]
  equipmentByUser: Record<number, { id: number; quantity: number }[]>
}

const DATABASE_NAME = 'fieldtrip_offline.db'
const TABLE_NAME = 'fieldtrip_offline_data'

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
