import AsyncStorage from '@react-native-async-storage/async-storage'
import { Api } from '../api/ApiConfig'

export default viewHealthChart = async (body) => {
  try {
    const token = await AsyncStorage.getItem('access_token')
    const response = await Api.post(
      `fieldtrip/chart/`,
      body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.detail || error.message)
  }
}
