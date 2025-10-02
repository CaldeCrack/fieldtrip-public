import { ActivityIndicator, StyleSheet } from 'react-native'
import { useState, useEffect, useContext } from 'react'
import { useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { jwtDecode, JwtPayload } from 'jwt-decode'
import { Text } from 'react-native-paper'

import { FieldtripList, Page } from '@components'
import { getUsersFieldtrips } from '@services'
import { FieldtriptContext } from './_layout'
import { COLORS } from '@colors'

interface Payload extends JwtPayload {
  user_id: number
}

const Home = () => {
  const router = useRouter()
  const [serverError, setServerError] = useState(false)
  const [fieldtripsData, setFieldtripsData] = useState([])
  const [loading, setLoading] = useState(true)
  const { FDispatch } = useContext(FieldtriptContext)
  const setState = (fieldtripID: string) => {
    FDispatch({ fieldtripID })
  }

  useEffect(() => {
    ;(async () => {
      const token = await AsyncStorage.getItem('access_token')
      if (!token) {
        router.replace('/login')
        return
      }
      const jwt = jwtDecode<Payload>(token)
      getUsersFieldtrips(jwt.user_id)
        .then(async (res) => {
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
        <ActivityIndicator size="large" color={COLORS.primary_50} />
      ) : fieldtripsData.length === 0 && !serverError ? (
        <Text>No hay salidas a campo para mostrar.</Text>
      ) : (
        <FieldtripList data={fieldtripsData} setState={setState} />
      )}
      {serverError && (
        <Text>Ocurrió un problema inesperado en el servidor.</Text>
      )}
    </Page>
  )
}

const styles = StyleSheet.create({
  page: {
    alignItems: 'center',
    maxWidth: 600,
    paddingHorizontal: 16,
  },
})

export default Home
