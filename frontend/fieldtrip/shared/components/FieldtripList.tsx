import { useRouter } from 'expo-router'
import { View, StyleSheet, Platform } from 'react-native'
import { Surface, Text, TouchableRipple, IconButton, MD3Colors } from 'react-native-paper'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Clipboard from 'expo-clipboard'
import { jwtDecode } from 'jwt-decode'

import { COLORS } from '@colors'
import { useEffect, useState } from 'react'
import { Payload } from '@types'
import {
  getSignupStatus,
  getFieldtripAttendees,
  getFieldtripEquipmentRequests,
  getFieldtripUserEquipment,
  getUsersHealthChart,
  viewHealthChart,
} from '@services'
import {
  initOfflineDb,
  saveFieldtripOfflineData,
  OfflineHealthData,
  isFieldtripOfflineSaved,
} from '../storage/offlineFieldtripDb'
import { useGlobalSnackbar } from '../context/useGlobalSnackbar'

type FieldtripStatus = {
  signupComplete: boolean
  isAuxiliar: boolean
  isGroupLeader: boolean
}

type FieldtripItem = {
  id: number
  title: string
  professor?: string
  startDate: string
  endDate: string
  invitationCode?: string
}

type Props = {
  data: FieldtripItem[]
  setState: (_id: number, _title: string) => void
}

const FieldtripList = ({ data, setState }: Props) => {
  const router = useRouter()
  const { showSnackbar } = useGlobalSnackbar()
  const [userID, setUserID] = useState<number | undefined>(undefined)
  const [isTeacher, setIsTeacher] = useState<boolean>(false)
  const [isStudent, setIsStudent] = useState<boolean>(false)
  const [isInventoryManager, setIsInventoryManager] = useState<boolean>(false)
  const [fieldtripStatuses, setFieldtripStatuses] = useState<Record<number, FieldtripStatus>>({})
  const [downloading, setDownloading] = useState<Record<number, boolean>>({})
  const [offlineSaved, setOfflineSaved] = useState<Record<number, boolean>>({})
  const isMobile = Platform.OS !== 'web'

  useEffect(() => {
    initOfflineDb().catch((error) => {
      console.warn('No se pudo preparar la base de datos offline:', error)
    })
  }, [])

  useEffect(() => {
    if (!isMobile || data.length === 0) return
    ;(async () => {
      try {
        const entries = await Promise.all(
          data.map(async (fieldtrip) => [
            fieldtrip.id,
            await isFieldtripOfflineSaved(fieldtrip.id),
          ] as const),
        )

        setOfflineSaved(
          entries.reduce((accumulator, [id, saved]) => {
            accumulator[id] = saved
            return accumulator
          }, {} as Record<number, boolean>),
        )
      } catch (error) {
        console.warn('No se pudo leer el estado offline:', error)
      }
    })()
  }, [data, isMobile])

  useEffect(() => {
    ;(async () => {
      const token = await AsyncStorage.getItem('access_token')
      if (!token) {
        router.replace('/login')
        return
      }
      const jwt = jwtDecode<Payload>(token)
      setUserID(jwt.user_id)
      setIsStudent(jwt.custom_data.is_student)
      setIsTeacher(jwt.custom_data.is_teacher)
      setIsInventoryManager(jwt.custom_data.role === 'inventory_manager')
    })()
  }, [router])

  useEffect(() => {
    if (!isStudent || !userID || data.length === 0) return
    ;(async () => {
      try {
        const statuses: Record<number, FieldtripStatus> = {}
        for (const fieldtrip of data) {
          try {
            const res = await getSignupStatus(userID, fieldtrip.id)
            statuses[fieldtrip.id] = {
              signupComplete: res.signup_complete,
              isAuxiliar: res.is_auxiliar,
              isGroupLeader: !!res.is_group_leader,
            }
          } catch {
            // If 404 or error, assume not signed up
            statuses[fieldtrip.id] = {
              signupComplete: false,
              isAuxiliar: false,
              isGroupLeader: false,
            }
          }
        }
        setFieldtripStatuses(statuses)
      } catch (err) {
        console.error('Error fetching signup statuses:', err)
      }
    })()
  }, [data, userID, isStudent])

  const copyToClipboard = async (invitationCode?: string) => {
    if (!invitationCode) return
    await Clipboard.setStringAsync(invitationCode)
    showSnackbar('El código de invitación a la salida ha sido copiado al portapapeles.')
  }

  const handleDownloadOfflineData = async (
    fieldtrip: FieldtripItem,
    event?: { stopPropagation?: () => void },
  ) => {
    event?.stopPropagation?.()
    if (downloading[fieldtrip.id]) {
      return
    }

    setDownloading((prev) => ({ ...prev, [fieldtrip.id]: true }))
    try {
      const [attendees, equipmentRequests] = await Promise.all([
        getFieldtripAttendees(fieldtrip.id),
        getFieldtripEquipmentRequests(fieldtrip.id),
      ])

      const healthByUserEntries = await Promise.all(
        attendees.map(async (attendee) => {
          if (!userID) {
            return [attendee.id, { constant: null, fieldtrip: null }] as const
          }

          try {
            const [fieldtripHealth, constantHealth] = await Promise.all([
              getUsersHealthChart(fieldtrip.id, attendee.id),
              viewHealthChart({
                viewer: userID,
                owner: attendee.id,
                fieldtrip: fieldtrip.id,
              }),
            ])

            return [
              attendee.id,
              {
                constant: constantHealth || null,
                fieldtrip: fieldtripHealth || null,
              },
            ] as const
          } catch (error) {
            console.warn('No se pudo cargar la ficha de salud:', error)
            return [attendee.id, { constant: null, fieldtrip: null }] as const
          }
        }),
      )

      const healthByUser = healthByUserEntries.reduce(
        (accumulator, [userId, healthData]) => {
          accumulator[userId] = healthData
          return accumulator
        },
        {} as Record<number, OfflineHealthData>,
      )

      const equipmentByUserEntries = await Promise.all(
        attendees.map(async (attendee) => {
          try {
            const equipment = await getFieldtripUserEquipment(fieldtrip.id, attendee.id)
            return [attendee.id, equipment] as const
          } catch (error) {
            console.warn('No se pudo cargar el equipo del asistente:', error)
            return [attendee.id, []] as const
          }
        }),
      )

      const equipmentByUser = equipmentByUserEntries.reduce(
        (accumulator, [userId, equipment]) => {
          accumulator[userId] = equipment
          return accumulator
        },
        {} as Record<number, { id: number; quantity: number }[]>,
      )

      const offlineData = {
        fieldtripId: fieldtrip.id,
        fieldtripName: fieldtrip.title,
        downloadedAt: new Date().toISOString(),
        downloadedByUserId: userID ?? null,
        attendees,
        equipmentRequests,
        equipmentByUser,
        healthByUser,
      }

      await saveFieldtripOfflineData(offlineData)
      setOfflineSaved((prev) => ({ ...prev, [fieldtrip.id]: true }))
      showSnackbar('Datos de la salida descargados para uso sin conexión.')
    } catch (error: any) {
      console.error('Error downloading fieldtrip data:', error)
      showSnackbar('No se pudieron descargar los datos de la salida.', { isError: true })
    } finally {
      setDownloading((prev) => ({ ...prev, [fieldtrip.id]: false }))
    }
  }

  return (
    <View style={styles.view}>
      {[...data]
        .sort((a, b) => {
          const aAux = !!fieldtripStatuses[a.id]?.isAuxiliar
          const bAux = !!fieldtripStatuses[b.id]?.isAuxiliar
          if (aAux && !bAux) return -1
          if (!aAux && bAux) return 1
          return 0
        })
        .map((item) => {
          const fieldtripStatus = fieldtripStatuses[item.id]
          const isAuxiliar = !!fieldtripStatus?.isAuxiliar
          const isGroupLeader = !!fieldtripStatus?.isGroupLeader
          const notSignedUp = fieldtripStatus?.signupComplete === false
          return (
            <TouchableRipple
              style={styles.ripple}
              key={String(item.id)}
              onPress={async () => {
                setState(item.id, item.title)
                try {
                  await AsyncStorage.setItem(
                    'fieldtrip_current',
                    JSON.stringify({ fieldtripID: item.id, fieldtripName: item.title }),
                  )
                } catch (error) {
                  console.warn('No se pudo guardar la salida a campo actual:', error)
                }
                const [day, month, year] = item.startDate.split('/').map(Number)
                const twoWeeksLater = new Date(year, month - 1, day)
                twoWeeksLater.setDate(twoWeeksLater.getDate() + 14)
                if (isStudent) {
                  router.push(isAuxiliar ? '/fieldtrip' : '/fieldtrip/join/form')
                }
                if (isTeacher || isInventoryManager) router.push('/fieldtrip')
              }}
            >
              <Surface elevation={0} style={styles.container}>
                {/* Copy Button */}
                {isTeacher && (
                  <IconButton
                    icon="content-copy"
                    size={20}
                    style={styles.cornerIcon}
                    onPress={() => copyToClipboard(item.invitationCode)}
                  />
                )}
                {isTeacher && isMobile && (
                  <IconButton
                    icon={
                      offlineSaved[item.id]
                        ? 'check-circle'
                        : downloading[item.id]
                          ? 'progress-download'
                          : 'cloud-download'
                    }
                    size={20}
                    style={styles.downloadIcon}
                    onPress={(event) => handleDownloadOfflineData(item, event)}
                    disabled={downloading[item.id] || offlineSaved[item.id]}
                  />
                )}
                {/* Not Signed Up Warning */}
                {isStudent && notSignedUp && (
                  <IconButton
                    icon="alert-circle-outline"
                    size={20}
                    style={styles.cornerIcon}
                    onPress={() => showSnackbar('Aún no te has inscrito en esta salida a campo.')}
                    iconColor={COLORS.error_500 || 'orange'}
                  />
                )}
                {/* Auxiliar Star */}
                {isStudent && isAuxiliar && (
                  <IconButton
                    icon="account-star"
                    size={20}
                    style={styles.auxiliarIcon}
                    iconColor={MD3Colors.tertiary50}
                  />
                )}
                {isStudent && isGroupLeader && (
                  <IconButton
                    icon="account-group"
                    size={20}
                    style={styles.groupLeaderIcon}
                    iconColor={COLORS.primary_50}
                  />
                )}
                {/* Signed Up Check */}
                {isStudent && !notSignedUp && (
                  <IconButton
                    icon="check-circle-outline"
                    size={20}
                    style={styles.cornerIcon}
                    onPress={() => showSnackbar('Estás inscrito/a en esta salida a campo.')}
                    iconColor={COLORS.success_500 || 'green'}
                  />
                )}
                <Text variant="titleLarge" style={{ fontWeight: 500 }}>
                  {item.title}
                </Text>
                <Text variant="bodyLarge">{item.professor}</Text>
                <View style={styles.dates}>
                  <Icon
                    name="calendar"
                    size={24}
                    style={{ marginRight: 8, color: COLORS.primary_50 }}
                  />
                  <Text
                    variant="bodyLarge"
                    style={{
                      paddingRight: 10,
                      color: COLORS.primary_50,
                      fontWeight: 500,
                    }}
                  >
                    {item.startDate}
                  </Text>
                  <View style={styles.line} />
                  <Text
                    variant="bodyLarge"
                    style={{
                      paddingLeft: 10,
                      color: COLORS.primary_50,
                      fontWeight: 500,
                    }}
                  >
                    {item.endDate}
                  </Text>
                </View>
              </Surface>
            </TouchableRipple>
          )
        })}
    </View>
  )
}

const styles = StyleSheet.create({
  view: {
    width: '100%',
  },
  ripple: {
    borderRadius: 10,
    minWidth: 320,
    flex: 1,
    marginBottom: 16,
  },
  line: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.primary_50,
  },
  avatar: {
    marginRight: 10,
    backgroundColor: COLORS.primary_50,
  },
  container: {
    borderRadius: 10,
    minWidth: 320,
    borderWidth: 1,
    borderColor: COLORS.gray_100,
    flexDirection: 'column',
    alignContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 20,
    position: 'relative',
  },
  dates: {
    flexDirection: 'row',
    marginVertical: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  professor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cornerIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  downloadIcon: {
    position: 'absolute',
    top: 10,
    right: 44,
    zIndex: 1,
  },
  auxiliarIcon: {
    position: 'absolute',
    top: 10,
    right: 44,
    zIndex: 1,
  },
  groupLeaderIcon: {
    position: 'absolute',
    top: 10,
    right: 44,
    zIndex: 1,
  },
})

export default FieldtripList
