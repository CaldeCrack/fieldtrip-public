import AsyncStorage from '@react-native-async-storage/async-storage'

import { Api } from '../api/ApiConfig'

const logout = async (email) => {
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
