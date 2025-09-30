import { Api } from '../api/ApiConfig'
import AsyncStorage from '@react-native-async-storage/async-storage'

const getChecklist = async (fieldtripId) => {
  try {
    const token = await AsyncStorage.getItem('access_token')
    const response = await Api.get(`checklist/?fieldtrip_id=${fieldtripId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  } catch (error) {
    console.error(
      'Error fetching checklist:',
      error.response?.data || error.message,
    )
    throw error
  }
}

export default getChecklist
