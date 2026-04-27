import React, { useEffect, useReducer, useState } from 'react'
import { TouchableOpacity } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { Stack, usePathname, useRouter } from 'expo-router'

import { COLORS } from '@colors'
import { ConfirmationModal } from '@components'
import { GlobalSnackbarProvider } from '../shared/context/GlobalSnackbarContext'
import {
  FStateType,
  FieldtriptContext,
  HCStateType,
  HealthChartContext,
} from '../shared/context/FieldtripContext'

const theme = {
  ...DefaultTheme,
  roundness: 4,
  colors: {
    ...DefaultTheme.colors,
    primary: '#00796b',
    primaryContainer: '#386641',
    secondary: '#a7c957',
    tertiary: '#bc4749',
  },
}

const HCInitialState = {
  fieldtripID: null,
  fieldtripName: null,
  healthChartOwner: null,
}

const FInitialState = {
  fieldtripID: null,
  fieldtripName: null,
}

const HCReducer = (_state: HCStateType, action: HCStateType) => {
  return {
    fieldtripID: action.fieldtripID,
    fieldtripName: action.fieldtripName,
    healthChartOwner: action.healthChartOwner,
  }
}

const FReducer = (_state: FStateType, action: FStateType) => {
  return {
    fieldtripID: action.fieldtripID,
    fieldtripName: action.fieldtripName,
  }
}

const StackLayout = () => {
  const router = useRouter()
  const pathname = usePathname()
  const [visible, setVisible] = useState<Record<string, boolean>>({})
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const _toggleModal = (name: string) => () => setVisible({ ...visible, [name]: !visible[name] })

  const _getVisible = (name: string) => !!visible[name]
  const [HCState, HCDispatch] = useReducer(HCReducer, HCInitialState)
  const [FState, FDispatch] = useReducer(FReducer, FInitialState)

  useEffect(() => {
    ;(async () => {
      const token = await AsyncStorage.getItem('access_token')
      setIsLoggedIn(!!token)
    })()
  }, [pathname])

  const logout = async () => {
    setIsLoggedIn(false)
    setVisible({ ...visible, ['modal']: !visible['modal'] })
    await AsyncStorage.removeItem('EXPO_CONSTANTS_INSTALLATION_ID')
    await AsyncStorage.removeItem('access_token')
    await AsyncStorage.removeItem('refresh_token')
    await AsyncStorage.removeItem('email')
    await AsyncStorage.removeItem('names')
    await AsyncStorage.removeItem('surnames')
    await AsyncStorage.removeItem('fieldtrip_current')
    router.replace('/login')
  }

  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <GlobalSnackbarProvider>
          <FieldtriptContext.Provider value={{ FState, FDispatch }}>
            <HealthChartContext.Provider value={{ HCState, HCDispatch }}>
              <Stack
                screenOptions={() => ({
                  headerShown: isLoggedIn,
                  headerStyle: {
                    backgroundColor: '#fafafa',
                    borderBottomWidth: 1,
                    borderBottomColor: COLORS.gray_100,
                    height: 70,
                  },
                  headerTintColor: '#00796b',
                  headerTitleStyle: {
                    fontSize: 28,
                    fontWeight: '700',
                    letterSpacing: 1,
                    paddingVertical: 6,
                  },
                  headerRight: () => {
                    return (
                      <TouchableOpacity onPress={() => _toggleModal('modal')()}>
                        <Icon
                          name="logout"
                          size={24}
                          style={{ marginRight: 16, color: '#00796b' }}
                        />
                      </TouchableOpacity>
                    )
                  },
                })}
              >
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="signup" options={{ headerShown: false }} />
                <Stack.Screen name="index" options={{ title: 'Salidas' }} />
                <Stack.Screen name="health-log" options={{ title: 'Log de salud' }} />
                <Stack.Screen name="profile" options={{ title: 'Perfil' }} />
                <Stack.Screen name="personal-info" options={{ title: 'Editar datos personales' }} />
                <Stack.Screen name="fieldtrip/index" options={{ title: 'Fieldtrip' }} />
                <Stack.Screen name="fieldtrip/create" options={{ title: 'Crear salida' }} />
                <Stack.Screen name="fieldtrip/chart" options={{ title: 'Ficha de salud' }} />
                <Stack.Screen name="fieldtrip/join/index" options={{ title: 'Unirse a salida' }} />
                <Stack.Screen name="fieldtrip/join/form" options={{ title: 'Fieldtrip' }} />
                <Stack.Screen
                  name="+not-found"
                  options={{
                    title: 'Página no existe',
                    headerRight: () => <TouchableOpacity />,
                  }}
                />
              </Stack>
              <ConfirmationModal
                visible={_getVisible('modal')}
                close={_toggleModal('modal')}
                open={logout}
                title="¿Está seguro/a que desea cerrar sesión?"
                description=""
              />
            </HealthChartContext.Provider>
          </FieldtriptContext.Provider>
        </GlobalSnackbarProvider>
      </PaperProvider>
    </SafeAreaProvider>
  )
}

export default StackLayout
