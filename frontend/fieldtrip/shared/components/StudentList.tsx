import { useRouter } from 'expo-router'
import { Divider, List, MD3Colors } from 'react-native-paper'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { jwtDecode } from 'jwt-decode'

import { StyleSheet, View } from 'react-native'
import { useEffect, useState } from 'react'
import ConfirmationModal from './ConfirmationModal'
import EquipmentSelectionModal from './EquipmentSelectionModal'
import { Payload, EquipmentItem } from '@types'
import {
  promoteToAuxiliar,
  demoteFromAuxiliar,
  promoteToGroupLeader,
  demoteFromGroupLeader,
  getSignupStatus,
  getFieldtripEquipment,
  getFieldtripUserEquipment,
} from '../services'
import { useGlobalSnackbar } from '../context/useGlobalSnackbar'
import assignUserEquipment from '../services/assignUserEquipment'

type StudentItem = {
  id: number
  name: string
  signupComplete?: boolean
  fieldtripID?: number
  isAuxiliar?: boolean
  isGroupLeader?: boolean
}

type Props = {
  data: StudentItem[]
  setState: (_fieldtripID: number, _name: string, _id: number) => void
}

const StudentList = ({ data, setState }: Props) => {
  const router = useRouter()
  const { showSnackbar } = useGlobalSnackbar()

  const [visible, setVisible] = useState<Record<string, boolean>>({})
  const [auxiliarUpdates, setAuxiliarUpdates] = useState<Record<number, boolean>>({})
  const [groupLeaderUpdates, setGroupLeaderUpdates] = useState<Record<number, boolean>>({})
  const [isTeacher, setIsTeacher] = useState(false)
  const [equipmentModalFor, setEquipmentModalFor] = useState<number | null>(null)
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>([])
  const [equipmentLoading, setEquipmentLoading] = useState(false)
  const [equipmentSelections, setEquipmentSelections] = useState<
    Record<number, { id: number; quantity: number }[]>
  >({})
  const [equipmentAvailable, setEquipmentAvailable] = useState<Record<number, number>>({})

  const _toggleModal = (name: string) => () => setVisible({ ...visible, [name]: !visible[name] })
  const _getVisible = (name: string) => !!visible[name]

  // Merge original data with local auxiliar updates
  const mergedData = data.map((item) => ({
    ...item,
    isAuxiliar: auxiliarUpdates.hasOwnProperty(item.id)
      ? auxiliarUpdates[item.id]
      : item.isAuxiliar,
    isGroupLeader: groupLeaderUpdates.hasOwnProperty(item.id)
      ? groupLeaderUpdates[item.id]
      : item.isGroupLeader,
  }))

  useEffect(() => {
    ;(async () => {
      const token = await AsyncStorage.getItem('access_token')
      if (!token) {
        router.replace('/login')
        return
      }
      const jwt = jwtDecode<Payload>(token)
      setIsTeacher(!!jwt.custom_data.is_teacher)
      if (jwt.custom_data.is_teacher) {
        return
      }

      const currentFieldtripID = data[0]?.fieldtripID
      if (!currentFieldtripID) {
        router.replace('/')
        return
      }

      try {
        const status = await getSignupStatus(jwt.user_id, currentFieldtripID)
        if (!status.is_auxiliar) {
          router.replace('/')
        }
      } catch {
        router.replace('/')
      }
    })()
  }, [router, data])

  return (
    <View style={styles.wrapper}>
      <List.Section style={styles.section}>
        {mergedData
          .sort((a, b) => {
            const aScore = a.isAuxiliar ? 2 : a.isGroupLeader ? 1 : 0
            const bScore = b.isAuxiliar ? 2 : b.isGroupLeader ? 1 : 0
            if (aScore > bScore) return -1
            if (aScore < bScore) return 1
            return 0
          })
          .map((item) => (
            <View key={String(item.id)}>
              <List.Accordion
                title={item.name}
                style={styles.accordion}
                right={() => (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {item.isAuxiliar && (
                      <List.Icon
                        color={MD3Colors.tertiary50}
                        icon="account-star"
                        style={{ marginRight: 8 }}
                      />
                    )}
                    {item.isGroupLeader && (
                      <List.Icon
                        color={MD3Colors.primary50}
                        icon="account-group"
                        style={{ marginRight: 8 }}
                      />
                    )}
                    <List.Icon
                      color={item.signupComplete ? MD3Colors.primary50 : MD3Colors.error50}
                      icon={item.signupComplete ? 'check' : 'alert-circle-outline'}
                    />
                  </View>
                )}
              >
                <List.Item
                  title="Estado de inscripción"
                  left={(props) => (
                    <List.Icon
                      {...props}
                      color={item.signupComplete ? MD3Colors.primary50 : MD3Colors.error50}
                      icon={item.signupComplete ? 'check' : 'alert-circle-outline'}
                    />
                  )}
                />
                {isTeacher && (
                  <List.Item
                    onPress={_toggleModal(`modal-${item.id}`)}
                    title="Ver ficha de salud"
                    left={(props) => <List.Icon {...props} icon="account-heart" />}
                  />
                )}
                {isTeacher && (
                  <List.Item
                    onPress={_toggleModal(`auxiliar-${item.id}`)}
                    title={item.isAuxiliar ? 'Remover auxiliar' : 'Promover a auxiliar'}
                    left={(props) => (
                      <List.Icon
                        {...props}
                        icon={item.isAuxiliar ? 'account-star-outline' : 'account-star'}
                      />
                    )}
                  />
                )}
                {isTeacher && (
                  <List.Item
                    onPress={_toggleModal(`group-leader-${item.id}`)}
                    title={
                      item.isGroupLeader ? 'Quitar líder de grupo' : 'Marcar como líder de grupo'
                    }
                    left={(props) => (
                      <List.Icon
                        {...props}
                        icon={item.isGroupLeader ? 'account-group-outline' : 'account-group'}
                      />
                    )}
                  />
                )}
                {isTeacher && item.isGroupLeader && (
                  <List.Item
                    onPress={async () => {
                      const fieldtripID = item.fieldtripID || null
                      setEquipmentModalFor(item.id)
                      try {
                        setEquipmentLoading(true)
                        const leaders = data.filter((leader) => leader.isGroupLeader)
                        const [equipmentRes, leaderAssignments] = await Promise.all([
                          getFieldtripEquipment(fieldtripID),
                          Promise.all(
                            leaders.map(async (leader) => ({
                              leaderId: leader.id,
                              equipment: await getFieldtripUserEquipment(fieldtripID, leader.id),
                            })),
                          ),
                        ])

                        const totalAssigned: Record<number, number> = {}
                        leaderAssignments.forEach((leader) => {
                          leader.equipment.forEach((assignment) => {
                            totalAssigned[assignment.id] =
                              (totalAssigned[assignment.id] || 0) + assignment.quantity
                          })
                        })

                        const currentAssignments =
                          leaderAssignments.find((leader) => leader.leaderId === item.id)
                            ?.equipment || []
                        const currentAssignedById = currentAssignments.reduce(
                          (accumulator: Record<number, number>, assignment) => {
                            accumulator[assignment.id] = assignment.quantity
                            return accumulator
                          },
                          {},
                        )
                        const available: Record<number, number> = {}
                        equipmentRes.forEach((equipmentItem) => {
                          const assignedTotal = totalAssigned[equipmentItem.id] || 0
                          const currentAssigned = currentAssignedById[equipmentItem.id] || 0
                          const remaining =
                            equipmentItem.quantity - (assignedTotal - currentAssigned)
                          available[equipmentItem.id] = Math.max(remaining, 0)
                        })

                        setEquipmentList(equipmentRes)
                        setEquipmentSelections((prev) => ({
                          ...prev,
                          [item.id]: currentAssignments,
                        }))
                        setEquipmentAvailable(available)
                      } catch (err) {
                        console.error('Error loading fieldtrip equipment', err)
                        showSnackbar('No se pudo cargar el equipamiento.', { isError: true })
                        setEquipmentList([])
                      } finally {
                        setEquipmentLoading(false)
                      }
                    }}
                    title="Asignar equipamiento"
                    left={(props) => <List.Icon {...props} icon="package-variant" />}
                  />
                )}
                <ConfirmationModal
                  visible={_getVisible(`modal-${item.id}`)}
                  close={_toggleModal(`modal-${item.id}`)}
                  open={() => {
                    setState(item.fieldtripID!, item.name, item.id)
                    setVisible({ ...visible, [`modal-${item.id}`]: false })
                    router.push('/fieldtrip/chart')
                  }}
                  title={`¿Está seguro/a que desea ver la información de salud de ${item.name}?`}
                  description={`Esta acción quedará registrada y podrá ser vista por ${item.name}.`}
                />
                <ConfirmationModal
                  visible={_getVisible(`auxiliar-${item.id}`)}
                  close={_toggleModal(`auxiliar-${item.id}`)}
                  open={async () => {
                    try {
                      const result = item.isAuxiliar
                        ? await demoteFromAuxiliar(item.id, item.fieldtripID!)
                        : await promoteToAuxiliar(item.id, item.fieldtripID!)
                      if (result) {
                        console.log(result.message)
                        // Update local state to reflect the change immediately
                        setAuxiliarUpdates((prev) => ({
                          ...prev,
                          [item.id]: !item.isAuxiliar,
                        }))
                        if (!item.isAuxiliar) {
                          setGroupLeaderUpdates((prev) => ({
                            ...prev,
                            [item.id]: false,
                          }))
                        }
                        showSnackbar(
                          item.isAuxiliar
                            ? `${item.name} ya no es auxiliar.`
                            : `${item.name} ahora es auxiliar.`,
                        )
                      }
                    } catch (error) {
                      console.error(
                        `Error ${item.isAuxiliar ? 'demoting from' : 'promoting to'} auxiliar:`,
                        error,
                      )
                      showSnackbar(
                        item.isAuxiliar
                          ? `No se pudo remover a ${item.name} como auxiliar.`
                          : `No se pudo promover a ${item.name} como auxiliar.`,
                        { isError: true },
                      )
                    }
                    setVisible({ ...visible, [`auxiliar-${item.id}`]: false })
                  }}
                  title={
                    item.isAuxiliar
                      ? `¿Está seguro/a que desea remover a ${item.name} como auxiliar?`
                      : `¿Está seguro/a que desea promover a ${item.name} a auxiliar?`
                  }
                  description={
                    item.isAuxiliar
                      ? `${item.name} ya no será auxiliar para esta salida a campo.`
                      : `${item.name} será marcado como auxiliar para esta salida a campo.`
                  }
                />
                <ConfirmationModal
                  visible={_getVisible(`group-leader-${item.id}`)}
                  close={_toggleModal(`group-leader-${item.id}`)}
                  open={async () => {
                    try {
                      const result = item.isGroupLeader
                        ? await demoteFromGroupLeader(item.id, item.fieldtripID!)
                        : await promoteToGroupLeader(item.id, item.fieldtripID!)
                      if (result) {
                        console.log(result.message)
                        setGroupLeaderUpdates((prev) => ({
                          ...prev,
                          [item.id]: !item.isGroupLeader,
                        }))
                        if (!item.isGroupLeader) {
                          setAuxiliarUpdates((prev) => ({
                            ...prev,
                            [item.id]: false,
                          }))
                        }
                        showSnackbar(
                          item.isGroupLeader
                            ? `${item.name} ya no es líder de grupo.`
                            : `${item.name} ahora es líder de grupo.`,
                        )
                      }
                    } catch (error) {
                      console.error(
                        `Error ${item.isGroupLeader ? 'demoting from' : 'promoting to'} group leader:`,
                        error,
                      )
                      showSnackbar(
                        item.isGroupLeader
                          ? `No se pudo quitar a ${item.name} como líder de grupo.`
                          : `No se pudo marcar a ${item.name} como líder de grupo.`,
                        { isError: true },
                      )
                    }
                    setVisible({ ...visible, [`group-leader-${item.id}`]: false })
                  }}
                  title={
                    item.isGroupLeader
                      ? `¿Está seguro/a que desea quitar a ${item.name} como líder de grupo?`
                      : `¿Está seguro/a que desea marcar a ${item.name} como líder de grupo?`
                  }
                  description={
                    item.isGroupLeader
                      ? `${item.name} ya no tendrá este tag en la salida a campo.`
                      : `${item.name} será marcado como líder de grupo en esta salida a campo.`
                  }
                />
                <EquipmentSelectionModal
                  visible={equipmentModalFor === item.id}
                  onClose={() => setEquipmentModalFor(null)}
                  onConfirm={async (equipment) => {
                    try {
                      setEquipmentLoading(true)
                      const nextSelections = {
                        ...equipmentSelections,
                        [item.id]: equipment,
                      }
                      setEquipmentSelections(nextSelections)
                      await assignUserEquipment(item.fieldtripID!, item.id, equipment)
                      showSnackbar(`Equipamiento asignado a ${item.name}.`)
                    } catch (error) {
                      console.error('Error assigning equipment to user:', error)
                      showSnackbar('No se pudo asignar el equipamiento.', { isError: true })
                    } finally {
                      setEquipmentLoading(false)
                      setEquipmentModalFor(null)
                    }
                  }}
                  equipmentList={equipmentList}
                  initialSelectedEquipment={equipmentSelections[item.id] || []}
                  availableById={equipmentAvailable}
                  loading={equipmentLoading}
                />
              </List.Accordion>
              <Divider style={styles.divider} />
            </View>
          ))}
      </List.Section>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
  },
  section: {
    width: '100%',
    paddingVertical: 0,
  },
  accordion: {
    backgroundColor: '#fafafa',
    paddingHorizontal: 0,
  },
  divider: {
    backgroundColor: MD3Colors.primary50,
  },
})

export default StudentList
