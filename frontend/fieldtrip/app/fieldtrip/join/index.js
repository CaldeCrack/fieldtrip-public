import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useState, useEffect } from 'react'
import { useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { jwtDecode } from 'jwt-decode'
import { Text } from 'react-native-paper'

import { Page, SimpleInput, ContainedButton } from '@components'
import { acceptFieldtripInvitation } from '@services'
import { COLORS } from '../../../styles/colors'

const JoinFieldtrip = () => {
  const router = useRouter()

  const [fieldtripCode, setFieldtripCode] = useState('')
  const [userID, setUserID] = useState(undefined)
  const [loading, setLoading] = useState(false)

  const sendJoinFieldtripRequest = async () => {
    if (fieldtripCode.length > 0) {
      setLoading(true)
      acceptFieldtripInvitation({
        invitation_code: fieldtripCode,
        user: userID,
      })
        .then(async (res) => {
          if (res.id) {
            router.replace('/')
            alert('Se ha unido a la salida exitosamente')
          }
          if (res.alreadyRegistered) {
            alert('Ya estás registrado en la salida')
            router.replace('/')
          }
        })
        .catch((error) => {
          throw new Error(error.response?.data?.detail || error.message)
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      alert('Debe ingresar un código')
    }
  }

  useEffect(() => {
    ;(async () => {
      const token = await AsyncStorage.getItem('access_token')
      if (!token) {
        router.replace('/login')
        return
      }
      const jwt = jwtDecode(token)
      if (!jwt.custom_data.is_student) {
        router.replace('/')
      }
      setUserID(jwt.user_id)
    })()
  }, [router])

  return (
    <Page style={styles.page} showTabs={true}>
      <View style={styles.container}>
        <Text variant="bodyLarge" style={styles.text}>
          Ingrese en el siguiente campo el código de invitación a la salida a
          terreno:
        </Text>
        <SimpleInput
          label="Ingrese el código de invitación *"
          onChange={(e) => setFieldtripCode(e.target.value)}
          onChangeText={(val) => setFieldtripCode(val)}
          value={fieldtripCode}
        />
      </View>
      <ContainedButton
        style={styles.btn}
        labelStyle={{ fontSize: 20, lineHeight: 24 }}
        onPress={sendJoinFieldtripRequest}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          'Aceptar invitación'
        )}
      </ContainedButton>
    </Page>
  )
}

const styles = StyleSheet.create({
  page: {
    alignItems: 'center',
    maxWidth: 600,
    paddingHorizontal: 16,
    marginTop: 24,
  },
  container: {
    alignItems: 'stretch',
    flex: 1,
    marginBottom: 60,
  },
  text: {
    marginBottom: 16,
  },
  btn: {
    marginTop: 24,
    backgroundColor: COLORS.primary_50,
    width: '100%',
  },
})

export default JoinFieldtrip
