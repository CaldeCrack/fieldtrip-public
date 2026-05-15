import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, StyleSheet, View, useWindowDimensions } from 'react-native'
import { Text, Surface } from 'react-native-paper'
import { useLocalSearchParams } from 'expo-router'

import { Page } from '@components'
import { COLORS } from '@colors'
import { getEducationalInstitutionEquipment } from '@services'
import { EquipmentItem } from '@types'

type EquipmentCardProps = {
  item: EquipmentItem
  width: number
}

const EquipmentCard = ({ item, width }: EquipmentCardProps) => (
  <Surface elevation={0} style={[styles.card, { width }]}>
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
            <EquipmentCard key={String(item.id)} item={item} width={cardWidth} />
          ))}
        </View>
      )}
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
    paddingVertical: 16,
    paddingHorizontal: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2,
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
})

export default EducationalInstitution
