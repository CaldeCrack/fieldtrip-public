import { Text, MD3Colors, TextInput } from 'react-native-paper'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { login } from '@services'
import {
  Modal,
  ContainedButton,
  IconInput,
  Page,
  TextButton,
  SimpleInput,
} from '@components'
import { COLORS } from '@colors'

const Login = () => {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginFailed, setLoginFailed] = useState(false)
  const [textSecure, setTextSecure] = useState(true)
  const [loading, setLoading] = useState(false)

  const [visible, setVisible] = useState({})
  const _toggleModal = (name) => () =>
    setVisible({ ...visible, [name]: !visible[name] })
  const _getVisible = (name) => !!visible[name]
  const [resetEmail, setResetEmail] = useState('')
  const [resetEmailConfirmation, setResetEmailConfirmation] = useState('')

  const sendLoginRequest = async () => {
    if (email.length > 0 && password.length > 0) {
      setLoading(true)
      login({
        email: email.toLocaleLowerCase(),
        password: password,
      })
        .then(async (res) => {
          if (res !== undefined && res.hasOwnProperty('tokens')) {
            await AsyncStorage.setItem('access_token', res.tokens.access)
            await AsyncStorage.setItem('refresh_token', res.tokens.refresh)
            await AsyncStorage.setItem('names', res.names)
            await AsyncStorage.setItem('surnames', res.surnames)
            await AsyncStorage.setItem('email', email)
            router.push('/')
          } else {
            setLoginFailed(true)
          }
        })
        .catch((error) => {
          setLoginFailed(true)
          throw new Error(error.response?.data?.detail || error.message)
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      alert('Debe completar todos los campos')
    }
  }

  useEffect(() => {
    ;(async () => {
      const token = await AsyncStorage.getItem('access_token')
      if (token) {
        router.replace('/')
        return
      }
    })()
  }, [router])

  return (
    <Page style={styles.page}>
      {/*
      <Tabs.Screen
        options={{ header: () => null, tabBarHideOnKeyboard: true }}
      />*/}
      <Text variant="headlineLarge" style={styles.title}>
        Fieldtrip
      </Text>
      <View>
        <IconInput
          iconName="account"
          label="Email *"
          onChangeText={(val) => setEmail(val)}
          value={email}
        />
        <IconInput
          iconName="lock"
          label="Contraseña *"
          onChangeText={(val) => setPassword(val)}
          secureTextEntry={textSecure}
          value={password}
          right={
            <TextInput.Icon
              icon={() => (
                <Icon
                  name={textSecure ? 'eye' : 'eye-off'}
                  size={20}
                  style={styles.showPassword}
                  color={MD3Colors.neutral50}
                  onPress={() => setTextSecure(!textSecure)}
                />
              )}
            />
          }
        />
        {loginFailed && (
          <View style={{ alignItems: 'center' }}>
            <Text variant="bodyLarge" style={{ color: MD3Colors.error50 }}>
              No se pudo iniciar sesión. {'\n'}
              Inténtelo nuevamente.
            </Text>
          </View>
        )}
      </View>

      <ContainedButton
        style={styles.loginBtn}
        labelStyle={{ fontSize: 18, lineHeight: 20 }}
        onPress={sendLoginRequest}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          'Iniciar sesión'
        )}
      </ContainedButton>
      {/**
      <TextButton
        onPress={_toggleModal('resetPassword')}
        style={styles.underline}
        labelStyle={styles.label}
      >
        ¿Olvidaste tu contraseña?
      </TextButton>
      */}
      <View style={styles.register}>
        <Text variant="bodyLarge">¿No tienes una cuenta?</Text>
        <TextButton
          onPress={() => router.replace('/signup')}
          style={styles.underline}
          labelStyle={styles.label}
        >
          Regístrate aquí
        </TextButton>
      </View>

      <Modal
        visible={_getVisible('resetPassword')}
        close={_toggleModal('resetPassword')}
        title="Resetear contraseña"
        description="Enviaremos instrucciones para resetear su contraseña al correo ingresado a continuación:"
      >
        <SimpleInput
          label="Email *"
          onChange={(e) => setResetEmail(e.target.value)}
          value={resetEmail}
        />
        <SimpleInput
          label="Confirmar email *"
          onChange={(e) => setResetEmailConfirmation(e.target.value)}
          value={resetEmailConfirmation}
        />

        <View style={styles.modalBtn}>
          <ContainedButton onPress={sendLoginRequest}>
            Enviar correo
          </ContainedButton>
        </View>
      </Modal>
    </Page>
  )
}

const styles = StyleSheet.create({
  page: {
    alignItems: 'center',
    maxWidth: 600,
    paddingHorizontal: 16,
  },
  title: {
    textAlign: 'center',
    fontWeight: 700,
    marginBottom: 50,
    marginTop: 70,
    color: COLORS.primary_50,
    letterSpacing: 1,
  },
  showPassword: {
    alignContent: 'center',
    paddingTop: 8,
  },
  loginBtn: {
    marginTop: 40,
    marginBottom: 10,
    width: 250,
  },
  underline: {
    textDecorationLine: 'underline',
    textDecorationColor: COLORS.primary_50,
  },
  register: {
    flex: 1,
    maxHeight: 40,
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalBtn: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 400,
    marginHorizontal: 5,
    marginVertical: 10,
    color: COLORS.primary_50,
  },
})

export default Login
