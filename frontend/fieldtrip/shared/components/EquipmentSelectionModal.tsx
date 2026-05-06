import { useEffect, useState } from 'react'
import { StyleSheet, View, ScrollView, ActivityIndicator, Pressable } from 'react-native'
import { TextInput, MD3Colors, Text, Dialog, Portal } from 'react-native-paper'
import { EquipmentItem } from '@types'
import { COLORS } from '@colors'

const APP_GREEN = '#00796b'
const MODAL_HOVER_OUTLINE = '#6b7280'
const MODAL_HOVER_BG = '#9ca3af'

interface EquipmentSelectionModalProps {
  visible: boolean
  onClose: () => void
  onConfirm: (_equipment: { id: number; quantity: number }[]) => void
  equipmentList: EquipmentItem[]
  initialSelectedEquipment?: { id: number; quantity: number }[]
  availableById?: Record<number, number>
  loading?: boolean
}

interface SelectedEquipment {
  [key: number]: number
}

const EquipmentSelectionModal = ({
  visible,
  onClose,
  onConfirm,
  equipmentList,
  initialSelectedEquipment = [],
  availableById,
  loading = false,
}: EquipmentSelectionModalProps) => {
  const [selectedEquipmentMap, setSelectedEquipmentMap] = useState<SelectedEquipment>({})
  const [isCancelHovered, setIsCancelHovered] = useState(false)
  const [isConfirmHovered, setIsConfirmHovered] = useState(false)

  useEffect(() => {
    if (!visible) {
      return
    }

    const initialSelection = initialSelectedEquipment.reduce<SelectedEquipment>(
      (accumulator, item) => {
        accumulator[item.id] = item.quantity
        return accumulator
      },
      {},
    )

    setSelectedEquipmentMap(initialSelection)
  }, [visible, initialSelectedEquipment])

  const handleQuantityChange = (equipmentId: number, quantity: string) => {
    const numQuantity = parseInt(quantity) || 0
    const maxAvailable = availableById ? availableById[equipmentId] : undefined
    const cappedQuantity =
      typeof maxAvailable === 'number' ? Math.min(numQuantity, maxAvailable) : numQuantity
    if (cappedQuantity > 0) {
      setSelectedEquipmentMap((prev) => ({
        ...prev,
        [equipmentId]: cappedQuantity,
      }))
    } else {
      setSelectedEquipmentMap((prev) => {
        const updated = { ...prev }
        delete updated[equipmentId]
        return updated
      })
    }
  }

  const handleConfirm = () => {
    const equipmentArray = Object.entries(selectedEquipmentMap).map(([id, quantity]) => ({
      id: parseInt(id),
      quantity,
    }))
    onConfirm(equipmentArray)
    handleClose()
  }

  const handleClose = () => {
    onClose()
  }

  if (loading) {
    return (
      <Portal>
        <Dialog visible={visible} onDismiss={handleClose} style={styles.dialog}>
          <Dialog.Content>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#00796b" />
              <Text style={styles.loadingText}>Cargando equipamiento...</Text>
            </View>
          </Dialog.Content>
        </Dialog>
      </Portal>
    )
  }

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={handleClose} style={styles.dialog}>
        <Dialog.Title style={styles.dialogTitle}>Seleccionar Equipamiento</Dialog.Title>
        <View style={styles.titleDivider} />
        <Dialog.Content style={styles.content}>
          <ScrollView style={styles.scrollView}>
            {equipmentList.length === 0 ? (
              <Text style={styles.emptyText}>No hay equipamiento disponible</Text>
            ) : (
              equipmentList.map((item) => (
                <View key={item.id} style={styles.equipmentItem}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemAvailable}>
                      Disponible: {availableById ? (availableById[item.id] ?? 0) : item.quantity}
                    </Text>
                  </View>
                  <TextInput
                    style={styles.quantityInput}
                    label="Cantidad"
                    keyboardType="number-pad"
                    value={String(selectedEquipmentMap[item.id] || '')}
                    onChangeText={(text) => handleQuantityChange(item.id, text)}
                    mode="outlined"
                    outlineColor={COLORS.gray_100}
                    activeOutlineColor={MD3Colors.primary50}
                  />
                </View>
              ))
            )}
          </ScrollView>
        </Dialog.Content>
        <View style={styles.actionsContainer}>
          <Dialog.Actions style={styles.actions}>
            <Pressable
              onPress={handleClose}
              onHoverIn={() => setIsCancelHovered(true)}
              onHoverOut={() => setIsCancelHovered(false)}
              style={({ hovered, pressed }) => [
                styles.actionButton,
                (hovered || isCancelHovered || pressed) && styles.actionButtonHover,
              ]}
            >
              <Text style={styles.actionButtonText}>Cerrar</Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              onHoverIn={() => setIsConfirmHovered(true)}
              onHoverOut={() => setIsConfirmHovered(false)}
              style={({ hovered, pressed }) => [
                styles.actionButton,
                (hovered || isConfirmHovered || pressed) && styles.actionButtonHover,
              ]}
            >
              <Text style={styles.actionButtonText}>Confirmar</Text>
            </Pressable>
          </Dialog.Actions>
        </View>
      </Dialog>
    </Portal>
  )
}

const styles = StyleSheet.create({
  dialog: {
    height: '96%',
    maxHeight: '96%',
    marginVertical: 12,
    alignSelf: 'center',
    width: 'auto',
    maxWidth: 560,
  },
  dialogTitle: {
    alignSelf: 'center',
    textAlign: 'center',
    width: 'auto',
  },
  titleDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  content: {
    flex: 1,
    paddingBottom: 0,
  },
  scrollView: {
    flex: 1,
    marginVertical: 8,
  },
  actionsContainer: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
  },
  equipmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray_100,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '400',
    color: '#000',
    marginBottom: 4,
  },
  itemAvailable: {
    fontSize: 12,
    color: '#4b5563',
  },
  quantityInput: {
    width: 132,
    height: 40,
  },
  actions: {
    paddingLeft: 10,
    paddingRight: 24,
    paddingVertical: 24,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    gap: 8,
  },
  actionButton: {
    backgroundColor: 'transparent',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  actionButtonHover: {
    backgroundColor: MODAL_HOVER_BG,
    borderColor: MODAL_HOVER_OUTLINE,
  },
  actionButtonText: {
    color: APP_GREEN,
    fontWeight: '600',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 12,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.gray_100,
    paddingVertical: 24,
  },
})

export default EquipmentSelectionModal
