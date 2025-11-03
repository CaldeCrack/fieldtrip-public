import AsyncStorage from '@react-native-async-storage/async-storage'
import { Api } from '../api/ApiConfig'

interface SignupStatus {
  signup_complete: boolean
}

const getSignupStatus = async (userId: number, fieldtripId: number): Promise<SignupStatus> => {
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
    throw new Error((error as any).response?.data?.detail || (error as any).message)
  }
}

export default getSignupStatus
