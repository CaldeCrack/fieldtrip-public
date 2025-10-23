import AsyncStorage from '@react-native-async-storage/async-storage'
import { Api } from '../api/ApiConfig'

const getSignupStatus = async (userId, fieldtripId) => {
  try {
    const token = await AsyncStorage.getItem('access_token')
    const response = await Api.get('fieldtrip/signup-status/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        user_id: userId,
        fieldtrip_id: fieldtripId,
      },
    })
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.detail || error.message)
  }
}

export default getSignupStatus
