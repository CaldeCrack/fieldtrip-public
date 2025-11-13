import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { jwtDecode } from 'jwt-decode'

const validToken = (token: string): boolean => {
  try {
    const jwt = jwtDecode(token)
    const currentDate = Date.now() / 1000
    return jwt.exp! >= currentDate
  } catch (err) {
    // If decoding fails, token is invalid
    // eslint-disable-next-line no-console
    console.error(err)
    return false
  }
}

export const Api: AxiosInstance = axios.create({
  // baseURL: 'http://127.0.0.1:8000',
  baseURL: 'https://fieldtrip.dcc.uchile.cl',
  headers: {
    accept: 'application/json',
  },
})

Api.interceptors.request.use(async (req: InternalAxiosRequestConfig) => {
  try {
    const token = await AsyncStorage.getItem('access_token')
    if (token) {
      if (!validToken(token)) {
        console.log('Invalid token')
        await AsyncStorage.removeItem('EXPO_CONSTANTS_INSTALLATION_ID')
        await AsyncStorage.removeItem('access_token')
        await AsyncStorage.removeItem('refresh_token')
        await AsyncStorage.removeItem('email')
        await AsyncStorage.removeItem('names')
        await AsyncStorage.removeItem('surnames')
      }
      req.headers = req.headers || {}
      req.headers['authorization'] = `Bearer ${token}`
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error)
  }
  return req
})

export default Api
