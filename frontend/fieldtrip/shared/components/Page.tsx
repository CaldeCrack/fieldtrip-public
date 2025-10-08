import React, { ReactNode, useEffect, useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  StyleProp,
  ViewStyle,
} from 'react-native'
import { TextInput } from 'react-native-paper'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import { jwtDecode, JwtPayload } from 'jwt-decode'

import { COLORS } from '@colors'

type Props = {
  children?: ReactNode
  style?: StyleProp<ViewStyle>
  showTabs?: boolean
}

interface Payload extends JwtPayload {
  custom_data: {
    is_student: boolean
    is_teacher: boolean
  }
}

const Page = ({ children, style, showTabs = false }: Props) => {
  const router = useRouter()
  const [isTeacher, setIsTeacher] = useState<boolean>(false)
  const [isStudent, setIsStudent] = useState<boolean>(false)

  useEffect(() => {
    ;(async () => {
      const token = await AsyncStorage.getItem('access_token')
      if (token) {
        try {
          const jwt = jwtDecode<Payload>(token)
          setIsStudent(!!jwt.custom_data?.is_student)
          setIsTeacher(!!jwt.custom_data?.is_teacher)
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error(err)
        }
      }
    })()
  }, [])

  return (
    <View style={{ backgroundColor: '#fafafa', flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, flexDirection: 'column' }}
      >
        <View style={[styles.container, style]}>{children}</View>
      </ScrollView>
      {showTabs && (
        <View style={styles.tabsBar}>
          <View style={styles.tab}>
            <TextInput.Icon
              icon={() => (
                <Icon
                  name={'home'}
                  size={32}
                  onPress={() => router.replace('/')}
                />
              )}
            />
          </View>
          {isTeacher && (
            <View style={styles.tab}>
              <TextInput.Icon
                style={styles.circleTab}
                icon={() => (
                  <Icon
                    name={'plus'}
                    color={'#fafafa'}
                    size={24}
                    onPress={() => router.push('/fieldtrip/create')}
                  />
                )}
              />
            </View>
          )}
          {isStudent && (
            <View style={styles.tab}>
              <TextInput.Icon
                style={styles.circleTab}
                icon={() => (
                  <Icon
                    name={'plus'}
                    color={'#fafafa'}
                    size={24}
                    onPress={() => router.push('/fieldtrip/join')}
                  />
                )}
              />
            </View>
          )}
          <View style={styles.tab}>
            <TextInput.Icon
              icon={() => (
                <Icon
                  name={'account'}
                  size={32}
                  onPress={() => router.push('/profile')}
                />
              )}
            />
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    marginHorizontal: 'auto',
    justifyContent: 'flex-start',
    paddingHorizontal: '2%',
    paddingTop: 16,
    paddingBottom: 90,
    backgroundColor: '#fafafa',
  },
  tabsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderTopWidth: 1,
    borderTopColor: COLORS.gray_100,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleTab: {
    backgroundColor: COLORS.primary_50,
    width: 32,
    height: 32,
  },
  icon: {
    alignItems: 'center',
  },
})

export default Page
