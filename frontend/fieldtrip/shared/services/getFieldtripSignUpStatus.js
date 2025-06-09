import AsyncStorage from '@react-native-async-storage/async-storage'
import { Api } from '../api/ApiConfig'

export default getFieldtripSignUpStatus = async (id) => {
  try {
    const token = await AsyncStorage.getItem('access_token')
    const response = await Api.get(`fieldtrip/${id}/signup-status/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.detail || error.message)
  }
}
