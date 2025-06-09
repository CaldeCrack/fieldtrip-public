import AsyncStorage from '@react-native-async-storage/async-storage'
import { Api } from '../api/ApiConfig'

export default acceptFieldtripInvitation = async (body) => {
  try {
    const token = await AsyncStorage.getItem('access_token')
    const response = await Api.post(
      `fieldtrip-attendee/`,
      body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
    return response.data
  } catch (error) {
    if (error.status === 409) {
      return {
        alreadyRegistered: true,
      }
    }
    throw new Error(error.response?.data?.detail || error.message)
  }
}
