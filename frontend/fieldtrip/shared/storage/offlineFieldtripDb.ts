import * as SQLite from 'expo-sqlite'

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

const db = SQLite.openDatabase(DATABASE_NAME)

type SqlValue = string | number | null

const runSql = (statement: string, params: SqlValue[] = []) =>
  new Promise<SQLite.SQLResultSet>((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        statement,
        params,
        (_, result) => resolve(result),
        (_, error) => {
          reject(error)
          return false
        },
      )
    })
  })

export const initOfflineDb = async () => {
  await runSql(
    `CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      fieldtrip_id INTEGER PRIMARY KEY NOT NULL,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,
  )
}

export const saveFieldtripOfflineData = async (payload: OfflineFieldtripData) => {
  const serialized = JSON.stringify(payload)
  await runSql(
    `INSERT OR REPLACE INTO ${TABLE_NAME} (fieldtrip_id, data, updated_at) VALUES (?, ?, ?);`,
    [payload.fieldtripId, serialized, payload.downloadedAt],
  )
}

export const getFieldtripOfflineData = async (
  fieldtripId: number,
): Promise<OfflineFieldtripData | null> => {
  const result = await runSql(`SELECT data FROM ${TABLE_NAME} WHERE fieldtrip_id = ? LIMIT 1;`, [
    fieldtripId,
  ])

  if (result.rows.length === 0) {
    return null
  }

  const row = result.rows.item(0) as { data?: string }
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
