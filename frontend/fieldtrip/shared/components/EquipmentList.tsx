import { StyleSheet, View } from 'react-native'
import { Chip, Divider, List, MD3Colors, Text } from 'react-native-paper'
import { useMemo, useState } from 'react'

import { EquipmentRequestItem, StudentAttendee } from '@types'
import { getFieldtripUserEquipment } from '@services'

type Props = {
  equipmentRequests?: EquipmentRequestItem[]
  fieldtripId?: number | null
  groupLeaders?: StudentAttendee[]
}

const STATUS_STYLES: Record<string, { backgroundColor: string; textColor: string }> = {
  pending: {
    backgroundColor: '#fef3c7',
    textColor: '#92400e',
  },
  approved: {
    backgroundColor: '#d1fae5',
    textColor: '#065f46',
  },
  rejected: {
    backgroundColor: '#fee2e2',
    textColor: '#991b1b',
  },
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pending':
      return 'Pendiente'
    case 'approved':
      return 'Aprobada'
    case 'rejected':
      return 'Rechazada'
    default:
      return status
  }
}

const getStatusStyle = (status: string) =>
  STATUS_STYLES[status] || {
    backgroundColor: '#e5e7eb',
    textColor: '#374151',
  }

const EquipmentList = ({
  equipmentRequests = [],
  fieldtripId = null,
  groupLeaders = [],
}: Props) => {
  const approvedRequests = equipmentRequests.filter(
    (request) => request.status === 'approved' && request.quantity > 0,
  )
  const leaders = useMemo(
    () => groupLeaders.filter((leader) => leader.isGroupLeader),
    [groupLeaders],
  )
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [assignments, setAssignments] = useState<
    Record<number, { id: number; name: string; quantity: number }[]>
  >({})
  const [assignmentLoading, setAssignmentLoading] = useState<Record<number, boolean>>({})
  const [assignmentError, setAssignmentError] = useState<Record<number, boolean>>({})

  const toggleAccordion = async (equipmentId: number) => {
    const nextExpanded = !expanded[equipmentId]
    setExpanded((prev) => ({ ...prev, [equipmentId]: nextExpanded }))

    if (!nextExpanded) {
      return
    }

    if (!fieldtripId || leaders.length === 0 || assignments[equipmentId]) {
      return
    }

    setAssignmentLoading((prev) => ({ ...prev, [equipmentId]: true }))
    setAssignmentError((prev) => ({ ...prev, [equipmentId]: false }))
    try {
      const leaderAssignments = await Promise.all(
        leaders.map(async (leader) => {
          const equipment = await getFieldtripUserEquipment(fieldtripId, leader.id)
          const match = equipment.find((item) => item.id === equipmentId)
          if (!match) {
            return null
          }
          return {
            id: leader.id,
            name: leader.name,
            quantity: match.quantity,
          }
        }),
      )

      setAssignments((prev) => ({
        ...prev,
        [equipmentId]: leaderAssignments.filter(Boolean) as {
          id: number
          name: string
          quantity: number
        }[],
      }))
    } catch (error) {
      console.error('Error loading leader assignments:', error)
      setAssignmentError((prev) => ({ ...prev, [equipmentId]: true }))
    } finally {
      setAssignmentLoading((prev) => ({ ...prev, [equipmentId]: false }))
    }
  }

  if (equipmentRequests.length === 0) {
    return (
      <View style={styles.emptyStateContainer}>
        <Text style={styles.emptyStateText}>No hay solicitudes de equipamiento.</Text>
      </View>
    )
  }

  return (
    <View style={styles.wrapper}>
      <List.Section style={styles.section}>
        <Text style={styles.sectionTitle}>Solicitudes de equipamiento</Text>
        {equipmentRequests.map((request) => {
          const isApproved = request.status === 'approved'
          const statusStyle = getStatusStyle(request.status)
          if (!isApproved) {
            return (
              <View key={String(request.id)}>
                <List.Item
                  title={request.name}
                  description={`Cantidad solicitada: ${request.quantity}`}
                  right={() => (
                    <Chip
                      style={[styles.statusChip, { backgroundColor: statusStyle.backgroundColor }]}
                      textStyle={[styles.statusText, { color: statusStyle.textColor }]}
                    >
                      {getStatusLabel(request.status)}
                    </Chip>
                  )}
                />
                <Divider style={styles.divider} />
              </View>
            )
          }

          return (
            <View key={String(request.id)}>
              <List.Accordion
                title={request.name}
                description={`Cantidad solicitada: ${request.quantity}`}
                expanded={!!expanded[request.id]}
                onPress={() => void toggleAccordion(request.id)}
                left={(props) => <List.Icon {...props} icon="tools" color={MD3Colors.primary50} />}
                right={() => (
                  <Chip
                    style={[styles.statusChip, { backgroundColor: statusStyle.backgroundColor }]}
                    textStyle={[styles.statusText, { color: statusStyle.textColor }]}
                  >
                    {getStatusLabel(request.status)}
                  </Chip>
                )}
              >
                {assignmentLoading[request.id] ? (
                  <List.Item title="Cargando asignaciones..." />
                ) : assignmentError[request.id] ? (
                  <List.Item title="No se pudieron cargar las asignaciones." />
                ) : (assignments[request.id] || []).length === 0 ? (
                  <List.Item title="Sin asignaciones para líderes de grupo." />
                ) : (
                  (assignments[request.id] || []).map((leader) => (
                    <List.Item
                      key={String(leader.id)}
                      title={leader.name}
                      right={() => <Text style={styles.quantity}>x{leader.quantity}</Text>}
                    />
                  ))
                )}
              </List.Accordion>
              <Divider style={styles.divider} />
            </View>
          )
        })}
        {equipmentRequests.length > 0 && approvedRequests.length === 0 ? (
          <List.Item title="No hay solicitudes aprobadas." />
        ) : null}
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
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  divider: {
    backgroundColor: MD3Colors.primary50,
  },
  quantity: {
    alignSelf: 'center',
    fontWeight: '700',
    marginRight: 4,
  },
  statusChip: {
    alignSelf: 'center',
    marginRight: 4,
  },
  statusText: {
    fontWeight: '700',
  },
  emptyStateContainer: {
    marginTop: 24,
    width: 300,
    alignSelf: 'center',
  },
  emptyStateText: {
    textAlign: 'center',
  },
})

export default EquipmentList
