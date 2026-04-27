import { StyleSheet, View } from 'react-native'
import { Chip, Text } from 'react-native-paper'

import { ContainedButton } from '@components'
import { EquipmentRequestItem } from '@types'

type Props = {
  request: EquipmentRequestItem
  onApprove: (_requestId: number) => void
  onReject: (_requestId: number) => void
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

const EquipmentRequestCard = ({ request, onApprove, onReject }: Props) => {
  const statusStyle = getStatusStyle(request.status)
  const statusLabel = getStatusLabel(request.status)

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={styles.title}>{request.name}</Text>
          <Text style={styles.subtitle}>Cantidad solicitada: {request.quantity}</Text>
        </View>
        <Chip
          style={[styles.statusChip, { backgroundColor: statusStyle.backgroundColor }]}
          textStyle={[styles.statusText, { color: statusStyle.textColor }]}
        >
          {statusLabel}
        </Chip>
      </View>
      <View style={styles.actions}>
        {request.status === 'pending' ? (
          <>
            <ContainedButton
              style={[styles.actionBtn, styles.approveBtn]}
              labelStyle={styles.approveLabel}
              onPress={() => onApprove(request.id)}
            >
              Aprobar
            </ContainedButton>
            <ContainedButton
              style={[styles.actionBtn, styles.rejectBtn]}
              labelStyle={styles.rejectLabel}
              onPress={() => onReject(request.id)}
            >
              Rechazar
            </ContainedButton>
          </>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  info: {
    gap: 6,
    flex: 1,
    paddingRight: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: '#4b5563',
  },
  statusChip: {
    alignSelf: 'flex-start',
    marginTop: 0,
  },
  statusText: {
    fontWeight: '700',
  },
  actions: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  actionBtn: {
    minWidth: 110,
  },
  approveBtn: {
    backgroundColor: '#d1fae5',
  },
  approveLabel: {
    color: '#065f46',
    fontWeight: 600,
  },
  rejectBtn: {
    backgroundColor: '#fee2e2',
  },
  rejectLabel: {
    color: '#991b1b',
    fontWeight: 600,
  },
})

export default EquipmentRequestCard
