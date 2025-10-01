import { useRouter } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { Avatar, Text } from 'react-native-paper'
import { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { jwtDecode, JwtPayload } from 'jwt-decode'

import { ContainedButton, Page } from '@components'
import { COLORS } from '@colors'

interface payload extends JwtPayload {
  is_student: boolean
}

const Profile = () => {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [isStudent, setIsStudent] = useState(false)

  useEffect(() => {
    ;(async () => {
      const token = await AsyncStorage.getItem('access_token')
      if (token) {
        const jwt = jwtDecode<payload>(token)
        setIsStudent(jwt.is_student)
        const names = await AsyncStorage.getItem('names')
        const surnames = await AsyncStorage.getItem('surnames')
        const email = await AsyncStorage.getItem('email')
        setFullName(`${names} ${surnames}`)
        setEmail(email!)
      }
    })()
  }, [])

  return (
    <Page style={styles.page} showTabs={true}>
      <View style={styles.container}>
        <View style={{ alignItems: 'center' }}>
          <Avatar.Text
            labelStyle={{ fontWeight: 600 }}
            label={fullName.length > 0 ? fullName[0].toLocaleUpperCase() : 'X'}
            size={60}
            style={styles.avatar}
          />
        </View>
        <View>
          <Text variant="titleMedium" style={{ fontWeight: 600 }}>
            Nombre
          </Text>
          <Text variant="bodyLarge">{fullName}</Text>
        </View>
        <View style={{ marginTop: 16 }}>
          <Text variant="titleMedium" style={{ fontWeight: 600 }}>
            Email
          </Text>
          <Text variant="bodyLarge">{email}</Text>
        </View>
      </View>
      {isStudent && (
        <ContainedButton
          style={styles.btn}
          labelStyle={{ fontSize: 20, lineHeight: 24 }}
          onPress={() => router.push('/health-log')}
        >
          Ver log de salud
        </ContainedButton>
      )}
      {/**
        <TextButton style={styles.btn} onPress={() => router.replace('/')}>
          Editar contraseña
        </TextButton>
        */}
    </Page>
  )
}

const styles = StyleSheet.create({
  page: {
    alignItems: 'center',
    maxWidth: 600,
    paddingHorizontal: 16,
  },
  container: {
    marginBottom: 32,
    alignSelf: 'flex-start',
    width: '100%',
  },
  avatar: {
    marginBottom: 10,
    backgroundColor: '#00796b',
  },
  btn: {
    marginTop: 6,
    backgroundColor: COLORS.primary_50,
    width: '100%',
  },
  divider: {
    backgroundColor: COLORS.gray_200,
    marginBottom: 32,
  },
  surface: {
    borderRadius: 20,
    minWidth: 320,
    backgroundColor: COLORS.gray_25,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    width: 350,
  },
})

export default Profile
