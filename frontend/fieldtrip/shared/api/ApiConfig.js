import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { jwtDecode } from "jwt-decode"

//import { logout } from '@services'

const validToken = (token) => {
  const jwt = jwtDecode(token)
  const currentDate = Date.now() / 1000
  return jwt.exp >= currentDate
}

export const Api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: {
    'accept': 'application/json',
  },
})

Api.interceptors.request.use(async (req) => {
  try {
    const token = await AsyncStorage.getItem('access_token')
    if (token) {
      if (token && !validToken(token)) {
        console.log('Invalid token')
        await AsyncStorage.removeItem('EXPO_CONSTANTS_INSTALLATION_ID')
        await AsyncStorage.removeItem('access_token')
        await AsyncStorage.removeItem('refresh_token')
        await AsyncStorage.removeItem('email')
        await AsyncStorage.removeItem('names')
        await AsyncStorage.removeItem('surnames')
      }
      req.headers['authorization'] = `Bearer ${token}`
    }
  } catch (error) {
    console.log(error)
  }
  return req
})
