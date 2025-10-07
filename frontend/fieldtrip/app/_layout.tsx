import React, { createContext, useReducer, useState } from 'react'
import { TouchableOpacity } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { Stack, useRouter } from 'expo-router'

import { COLORS } from '@colors'
import { ConfirmationModal } from '@components'

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

interface HCStateType {
  fieldtripID: number | null
  fieldtripName: string | null
  healthChartOwner: string | null
}

interface FStateType {
  fieldtripID: number | null
}

interface IHealthChartContext {
  HCState: HCStateType
  HCDispatch: React.Dispatch<any>
}

interface IFieldtriptContext {
  FState: FStateType
  FDispatch: React.Dispatch<any>
}

export const HealthChartContext = createContext<IHealthChartContext>(
  {} as IHealthChartContext,
)
export const FieldtriptContext = createContext<IFieldtriptContext>(
  {} as IFieldtriptContext,
)

const HCInitialState = {
  fieldtripID: null,
  fieldtripName: null,
  healthChartOwner: null,
}

const FInitialState = {
  fieldtripID: null,
}

const HCReducer = (_state: HCStateType, action: HCStateType) => {
  return {
    fieldtripID: action.fieldtripID,
    fieldtripName: action.fieldtripName,
    healthChartOwner: action.healthChartOwner,
  }
}

const FReducer = (_state: FStateType, action: FStateType) => {
  return { fieldtripID: action.fieldtripID }
}

const StackLayout = () => {
  const router = useRouter()
  const [visible, setVisible] = useState<Record<string, boolean>>({})
  const _toggleModal = (name: string) => () =>
    setVisible({ ...visible, [name]: !visible[name] })

  const _getVisible = (name: string) => !!visible[name]
  const [HCState, HCDispatch] = useReducer(HCReducer, HCInitialState)
  const [FState, FDispatch] = useReducer(FReducer, FInitialState)

  const logout = async () => {
    setVisible({ ...visible, ['modal']: !visible['modal'] })
    await AsyncStorage.removeItem('EXPO_CONSTANTS_INSTALLATION_ID')
    await AsyncStorage.removeItem('access_token')
    await AsyncStorage.removeItem('refresh_token')
    await AsyncStorage.removeItem('email')
    await AsyncStorage.removeItem('names')
    await AsyncStorage.removeItem('surnames')
    router.replace('/login')
  }

  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <FieldtriptContext.Provider value={{ FState, FDispatch }}>
          <HealthChartContext.Provider value={{ HCState, HCDispatch }}>
            <Stack
              screenOptions={() => ({
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
              <Stack.Screen
                name="health-log"
                options={{ title: 'Log de salud' }}
              />
              <Stack.Screen name="profile" options={{ title: 'Perfil' }} />
              <Stack.Screen
                name="fieldtrip/index"
                options={{ title: 'Fieldtrip' }}
              />
              <Stack.Screen
                name="fieldtrip/create"
                options={{ title: 'Crear salida' }}
              />
              <Stack.Screen
                name="fieldtrip/chart"
                options={{ title: 'Ficha de salud' }}
              />
              <Stack.Screen
                name="fieldtrip/join/index"
                options={{ title: 'Unirse a fieldtrip' }}
              />
              <Stack.Screen
                name="fieldtrip/join/form"
                options={{ title: 'Fieldtrip' }}
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
      </PaperProvider>
    </SafeAreaProvider>
  )
}

export default StackLayout
