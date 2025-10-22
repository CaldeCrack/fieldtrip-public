import { useRouter } from 'expo-router'
import { View, StyleSheet } from 'react-native'
import { Surface, Text, TouchableRipple, IconButton } from 'react-native-paper'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Clipboard from 'expo-clipboard'
import { jwtDecode } from 'jwt-decode'

import { COLORS } from '@colors'
import { useEffect, useState } from 'react'

type FieldtripItem = {
  id: number
  title: string
  professor?: string
  startDate: string
  endDate: string
  invitationCode?: string
}

type Props = {
  data: FieldtripItem[]
  setState: (_id: number) => void
}

interface Payload {
  custom_data: {
    is_student: boolean
    is_teacher: boolean
  }
}

const FieldtripList = ({ data, setState }: Props) => {
  const router = useRouter()
  const [isTeacher, setIsTeacher] = useState<boolean>(false)
  const [isStudent, setIsStudent] = useState<boolean>(false)

  useEffect(() => {
    ;(async () => {
      const token = await AsyncStorage.getItem('access_token')
      if (!token) {
        router.replace('/login')
        return
      }
      const jwt = jwtDecode<Payload>(token)
      setIsStudent(jwt.custom_data.is_student)
      setIsTeacher(jwt.custom_data.is_teacher)
    })()
  }, [router])

  const copyToClipboard = async (invitationCode?: string) => {
    if (!invitationCode) return
    await Clipboard.setStringAsync(invitationCode)
    alert('El código de invitación a la salida ha sido copiado al portapapeles.')
  }

  return (
    <View style={styles.view}>
      {data.map((item) => (
        <TouchableRipple
          style={styles.ripple}
          key={String(item.id)}
          onPress={() => {
            setState(item.id)
            const [day, month, year] = item.startDate.split('/').map(Number)
            const twoWeeksLater = new Date(year, month - 1, day)
            twoWeeksLater.setDate(twoWeeksLater.getDate() + 14)
            if (isStudent) router.push('/fieldtrip/join/form')
            if (isTeacher) router.push('/fieldtrip')
          }}
        >
          <Surface elevation={0} style={styles.container}>
            {/* Copy Button */}
            {isTeacher && (
              <IconButton
                icon="content-copy"
                size={20}
                style={styles.copyButton}
                onPress={() => copyToClipboard(item.invitationCode)}
              />
            )}
            <Text variant="titleLarge" style={{ fontWeight: 500 }}>
              {item.title}
            </Text>
            <Text variant="bodyLarge">{item.professor}</Text>
            <View style={styles.dates}>
              <Icon
                name="calendar"
                size={24}
                style={{ marginRight: 8, color: COLORS.primary_50 }}
              />
              <Text
                variant="bodyLarge"
                style={{
                  paddingRight: 10,
                  color: COLORS.primary_50,
                  fontWeight: 500,
                }}
              >
                {item.startDate}
              </Text>
              <View style={styles.line} />
              <Text
                variant="bodyLarge"
                style={{
                  paddingLeft: 10,
                  color: COLORS.primary_50,
                  fontWeight: 500,
                }}
              >
                {item.endDate}
              </Text>
            </View>
          </Surface>
        </TouchableRipple>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  view: {
    width: '100%',
  },
  ripple: {
    borderRadius: 10,
    minWidth: 320,
    flex: 1,
    marginBottom: 16,
  },
  line: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.primary_50,
  },
  avatar: {
    marginRight: 10,
    backgroundColor: COLORS.primary_50,
  },
  container: {
    borderRadius: 10,
    minWidth: 320,
    borderWidth: 1,
    borderColor: COLORS.gray_100,
    flexDirection: 'column',
    alignContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 20,
    position: 'relative',
  },
  dates: {
    flexDirection: 'row',
    marginVertical: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  professor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  copyButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
})

export default FieldtripList
