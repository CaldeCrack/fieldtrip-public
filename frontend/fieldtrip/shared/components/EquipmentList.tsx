import { StyleSheet, View } from 'react-native'
import { Divider, List, MD3Colors, Text } from 'react-native-paper'
import { useMemo, useState } from 'react'

import { EquipmentItem, StudentAttendee } from '@types'
import { getFieldtripUserEquipment } from '@services'

type Props = {
  data: EquipmentItem[]
  fieldtripId?: number | null
  groupLeaders?: StudentAttendee[]
}

const EquipmentList = ({ data = [], fieldtripId = null, groupLeaders = [] }: Props) => {
  const filteredEquipment = data.filter((item) => item.quantity > 0)
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

  if (filteredEquipment.length === 0) {
    return (
      <View style={styles.emptyStateContainer}>
        <Text style={styles.emptyStateText}>No se ha registrado equipamiento en uso.</Text>
      </View>
    )
  }

  return (
    <View style={styles.wrapper}>
      <List.Section style={styles.section}>
        {filteredEquipment.map((item) => (
          <View key={String(item.id)}>
            <List.Accordion
              title={item.name}
              description="Equipamiento en uso"
              expanded={!!expanded[item.id]}
              onPress={() => void toggleAccordion(item.id)}
              left={(props) => <List.Icon {...props} icon="tools" color={MD3Colors.primary50} />}
              right={() => <Text style={styles.quantity}>x{item.quantity}</Text>}
            >
              {assignmentLoading[item.id] ? (
                <List.Item title="Cargando asignaciones..." />
              ) : assignmentError[item.id] ? (
                <List.Item title="No se pudieron cargar las asignaciones." />
              ) : (assignments[item.id] || []).length === 0 ? (
                <List.Item title="Sin asignaciones para líderes de grupo." />
              ) : (
                (assignments[item.id] || []).map((leader) => (
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
  divider: {
    backgroundColor: MD3Colors.primary50,
  },
  quantity: {
    alignSelf: 'center',
    fontWeight: '700',
    marginRight: 4,
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
