import AsyncStorage from '@react-native-async-storage/async-storage'

import { Api } from '../api/ApiConfig'

interface LogoutResponse {
  [key: string]: string | number | boolean
}

const logout = async (email: string): Promise<LogoutResponse | undefined> => {
  try {
    const response = await Api.post(
      'logout/',
      JSON.stringify({
        email,
      }),
    )
    AsyncStorage.removeItem('access_token')
    AsyncStorage.removeItem('email')
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export default logout
