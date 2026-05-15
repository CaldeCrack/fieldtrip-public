import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native'
import { Text, Surface } from 'react-native-paper'
import { useLocalSearchParams } from 'expo-router'

import { ContainedButton, Modal, Page, SimpleInput, TextButton } from '@components'
import { COLORS } from '@colors'
import {
  getEducationalInstitutionEquipment,
  updateEducationalInstitutionEquipment,
} from '@services'
import { EquipmentItem } from '@types'
import { useGlobalSnackbar } from '../../shared/context/useGlobalSnackbar'

type EquipmentCardProps = {
  item: EquipmentItem
  width: number
  isHovered: boolean
  onPress: () => void
  onHoverIn: () => void
  onHoverOut: () => void
}

const EquipmentCard = ({
  item,
  width,
  isHovered,
  onPress,
  onHoverIn,
  onHoverOut,
}: EquipmentCardProps) => (
  <Pressable
    style={[styles.card, { width }]}
    onPress={onPress}
    onHoverIn={onHoverIn}
    onHoverOut={onHoverOut}
  >
    <Surface elevation={0} style={[styles.cardSurface, isHovered && styles.cardSurfaceHover]}>
      <Text variant="titleMedium" style={styles.cardTitle}>
        {item.name}
      </Text>
      <Text>
        <Text variant="bodyLarge" style={styles.cardQuantity}>
          {item.quantity}{' '}
        </Text>
        <Text variant="bodyMedium" style={styles.cardLabel}>
          disponibles
        </Text>
      </Text>
    </Surface>
  </Pressable>
)

const EducationalInstitution = () => {
  const params = useLocalSearchParams()
  const { width: windowWidth } = useWindowDimensions()
  const institutionId = useMemo(() => {
    const raw = params.institutionId
    if (Array.isArray(raw)) {
      return Number(raw[0])
    }
    return raw ? Number(raw) : null
  }, [params.institutionId])
  const institutionName = useMemo(() => {
    const raw = params.institutionName
    if (Array.isArray(raw)) {
      return raw[0]
    }
    return raw ? String(raw) : ''
  }, [params.institutionName])

  const [equipment, setEquipment] = useState<EquipmentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [selectedItem, setSelectedItem] = useState<EquipmentItem | null>(null)
  const [quantityInput, setQuantityInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const { showSnackbar } = useGlobalSnackbar()

  const gridGap = 12
  const gridPadding = 32
  const gridMaxWidth = 800
  const gridWidth = Math.min(windowWidth, gridMaxWidth) - gridPadding
  const columns = gridWidth >= 750 ? 3 : gridWidth >= 450 ? 2 : 1
  const cardWidth = Math.max(160, Math.floor((gridWidth - gridGap * (columns - 1)) / columns))

  useEffect(() => {
    if (!institutionId) {
      setLoading(false)
      setError(true)
      return
    }

    let isMounted = true
    setLoading(true)
    setError(false)

    getEducationalInstitutionEquipment(institutionId)
      .then((data) => {
        if (isMounted) {
          setEquipment(data)
        }
      })
      .catch(() => {
        if (isMounted) {
          setError(true)
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [institutionId])

  return (
    <Page style={styles.page} showTabs={true}>
      {institutionName ? (
        <Text variant="titleLarge" style={styles.title}>
          {institutionName}
        </Text>
      ) : null}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary_50} style={styles.loading} />
      ) : error ? (
        <View style={styles.emptyState}>
          <Text>No se pudo cargar el equipamiento.</Text>
        </View>
      ) : equipment.length === 0 ? (
        <View style={styles.emptyState}>
          <Text>No hay equipamiento registrado para esta institución.</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {equipment.map((item) => (
            <EquipmentCard
              key={String(item.id)}
              item={item}
              width={cardWidth}
              isHovered={hoveredId === item.id}
              onHoverIn={() => setHoveredId(item.id)}
              onHoverOut={() => setHoveredId(null)}
              onPress={() => {
                setSelectedItem(item)
                setQuantityInput(String(item.quantity ?? ''))
              }}
            />
          ))}
        </View>
      )}
      <Modal
        visible={!!selectedItem}
        close={() => setSelectedItem(null)}
        title={selectedItem ? selectedItem.name : 'Actualizar cantidad'}
        description="Actualiza la cantidad disponible para este ítem."
      >
        <SimpleInput
          label="Cantidad"
          value={quantityInput}
          keyboardType="numeric"
          onChangeText={(value) => setQuantityInput(value)}
        />
        {saveError ? <Text style={styles.saveError}>{saveError}</Text> : null}
        <View style={styles.modalActions}>
          <TextButton onPress={() => setSelectedItem(null)}>Cancelar</TextButton>
          <ContainedButton
            loading={saving}
            disabled={saving}
            onPress={async () => {
              if (!selectedItem || !institutionId) {
                return
              }

              const parsedQuantity = Number(quantityInput)
              if (!Number.isFinite(parsedQuantity) || parsedQuantity < 0) {
                setSaveError('La cantidad debe ser un numero mayor o igual a 0.')
                return
              }

              try {
                setSaving(true)
                setSaveError(null)
                const updated = await updateEducationalInstitutionEquipment(institutionId, {
                  equipment_id: selectedItem.id,
                  quantity: parsedQuantity,
                })
                setEquipment((prev) =>
                  prev.map((item) =>
                    item.id === updated.id ? { ...item, quantity: updated.quantity } : item,
                  ),
                )
                setSelectedItem(null)
                showSnackbar('Cantidad actualizada correctamente.')
              } catch (err: any) {
                const message = err.message || 'No se pudo actualizar el equipamiento.'
                setSaveError(message)
                showSnackbar(message, { isError: true })
              } finally {
                setSaving(false)
              }
            }}
          >
            Guardar cambios
          </ContainedButton>
        </View>
      </Modal>
    </Page>
  )
}

const styles = StyleSheet.create({
  page: {
    alignItems: 'center',
    maxWidth: 800,
    paddingHorizontal: 16,
  },
  title: {
    alignSelf: 'flex-start',
    fontWeight: '600',
    marginBottom: 12,
  },
  loading: {
    marginTop: 24,
  },
  emptyState: {
    width: 300,
    marginTop: 24,
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: 12,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary_50,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2,
  },
  cardSurface: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 14,
    backgroundColor: '#fafafa',
  },
  cardSurfaceHover: {
    backgroundColor: COLORS.primary_25,
  },
  cardTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  cardQuantity: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary_50,
  },
  cardLabel: {
    color: COLORS.gray_600,
  },
  saveError: {
    color: COLORS.error_600,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalActions: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
})

export default EducationalInstitution
