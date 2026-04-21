import React, { useState } from 'react'
import { StyleSheet, View, ScrollView, ActivityIndicator } from 'react-native'
import { TextInput, MD3Colors, Text, Button, Dialog, Portal } from 'react-native-paper'
import { EquipmentItem } from '@types'
import { COLORS } from '@colors'

interface EquipmentSelectionModalProps {
  visible: boolean
  onClose: () => void
  onConfirm: (equipment: { id: number; quantity: number }[]) => void
  equipmentList: EquipmentItem[]
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
  loading = false,
}: EquipmentSelectionModalProps) => {
  const [selectedEquipment, setSelectedEquipment] = useState<SelectedEquipment>({})

  const handleQuantityChange = (equipmentId: number, quantity: string) => {
    const numQuantity = parseInt(quantity) || 0
    if (numQuantity > 0) {
      setSelectedEquipment((prev) => ({
        ...prev,
        [equipmentId]: numQuantity,
      }))
    } else {
      setSelectedEquipment((prev) => {
        const updated = { ...prev }
        delete updated[equipmentId]
        return updated
      })
    }
  }

  const handleConfirm = () => {
    const equipmentArray = Object.entries(selectedEquipment).map(([id, quantity]) => ({
      id: parseInt(id),
      quantity,
    }))
    onConfirm(equipmentArray)
    handleClose()
  }

  const handleClose = () => {
    setSelectedEquipment({})
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
        <Dialog.Title>Seleccionar Equipamiento</Dialog.Title>
        <Dialog.Content>
          <ScrollView style={styles.scrollView}>
            {equipmentList.length === 0 ? (
              <Text style={styles.emptyText}>No hay equipamiento disponible</Text>
            ) : (
              equipmentList.map((item) => (
                <View key={item.id} style={styles.equipmentItem}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemAvailable}>Disponible: {item.quantity}</Text>
                  </View>
                  <TextInput
                    style={styles.quantityInput}
                    label="Cantidad"
                    keyboardType="number-pad"
                    value={String(selectedEquipment[item.id] || '')}
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
        <Dialog.Actions style={styles.actions}>
          <Button onPress={handleClose} textColor={MD3Colors.primary50}>
            Cancelar
          </Button>
          <Button
            onPress={handleConfirm}
            mode="contained"
            buttonColor={MD3Colors.primary50}
            textColor="white"
          >
            Confirmar
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  )
}

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '80%',
  },
  scrollView: {
    maxHeight: 400,
    marginVertical: 8,
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
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  itemAvailable: {
    fontSize: 12,
    color: COLORS.gray_100,
  },
  quantityInput: {
    width: 90,
    height: 40,
  },
  actions: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    justifyContent: 'flex-end',
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
