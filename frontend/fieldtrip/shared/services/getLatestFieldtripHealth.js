import AsyncStorage from '@react-native-async-storage/async-storage'
import { Api } from '../api/ApiConfig'

export default getLatestFieldtripHealth = async () => {
  try {
    const token = await AsyncStorage.getItem('access_token')
    const response = await Api.get(`fieldtrip/latest-health/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.detail || error.message)
  }
}
