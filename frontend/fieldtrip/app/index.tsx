import { ActivityIndicator, StyleSheet } from 'react-native'
import { useState, useEffect, useContext, SetStateAction } from 'react'
import { useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { jwtDecode } from 'jwt-decode'
import { Text } from 'react-native-paper'

import { FieldtripList, Page } from '@components'
import { getUsersFieldtrips, getInventoryFieldtrips } from '@services'
import { FieldtriptContext } from '../shared/context/FieldtripContext'
import { COLORS } from '@colors'
import { Payload, FieldtripItem } from '@types'

const Home = () => {
  const router = useRouter()
  const [serverError, setServerError] = useState(false)
  const [fieldtripsData, setFieldtripsData] = useState<FieldtripItem[]>([])
  const [loading, setLoading] = useState(true)
  const { FDispatch } = useContext(FieldtriptContext)
  const setState = (fieldtripID: number, fieldtripName: string) => {
    FDispatch({ fieldtripID, fieldtripName })
  }

  useEffect(() => {
    ;(async () => {
      const token = await AsyncStorage.getItem('access_token')
      if (!token) {
        router.replace('/login')
        return
      }
      const jwt = jwtDecode<Payload>(token)
      const isInventoryManager = jwt.custom_data.role === 'inventory_manager'
      const request = isInventoryManager
        ? getInventoryFieldtrips()
        : getUsersFieldtrips(jwt.user_id)

      request
        .then(async (res: SetStateAction<FieldtripItem[]>) => {
          if (res) {
            setFieldtripsData(res)
          }
        })
        .catch(() => {
          setServerError(true)
        })
        .finally(() => {
          setLoading(false)
        })
    })()
  }, [router])

  return (
    <Page style={styles.page} showTabs={true}>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary_50} style={styles.loading} />
      ) : fieldtripsData.length === 0 && !serverError ? (
        <Text>No hay salidas a campo para mostrar.</Text>
      ) : (
        <FieldtripList data={fieldtripsData} setState={setState} />
      )}
      {serverError && <Text>Ocurrió un problema inesperado en el servidor.</Text>}
    </Page>
  )
}

const styles = StyleSheet.create({
  page: {
    alignItems: 'center',
    maxWidth: 600,
    paddingHorizontal: 16,
  },
  loading: {
    marginTop: '48%',
  },
})

export default Home
