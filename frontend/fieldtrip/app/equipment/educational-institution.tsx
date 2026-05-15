import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { Text, Surface } from 'react-native-paper'
import { useLocalSearchParams } from 'expo-router'

import { Page } from '@components'
import { COLORS } from '@colors'
import { getEducationalInstitutionEquipment } from '@services'
import { EquipmentItem } from '@types'

const EducationalInstitution = () => {
  const params = useLocalSearchParams()
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
            <Surface key={String(item.id)} elevation={0} style={styles.card}>
              <Text variant="titleMedium" style={styles.cardTitle}>
                {item.name}
              </Text>
              <Text variant="bodyLarge" style={styles.cardQuantity}>
                {item.quantity}
              </Text>
              <Text variant="bodySmall" style={styles.cardLabel}>
                disponibles
              </Text>
            </Surface>
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
    gap: 12,
  },
  card: {
    width: '48%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray_100,
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  cardTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  cardQuantity: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary_600,
  },
  cardLabel: {
    color: COLORS.gray_600,
  },
})

export default EducationalInstitution
