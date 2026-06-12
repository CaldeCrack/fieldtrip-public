import AsyncStorage from '@react-native-async-storage/async-storage'
import { Api } from '../api/ApiConfig'

interface HealthLogViewRequest {
  viewer_id: number
  owner: number
  fieldtrip_id: number
}

interface HealthLogViewResponse {
  [key: string]: string | number | boolean
}

const registerHealthLogView = async (
  body: HealthLogViewRequest,
): Promise<HealthLogViewResponse> => {
  try {
    const token = await AsyncStorage.getItem('access_token')
    if (!token) {
      throw new Error('No user is logged in to sync health logs')
    }
    const response = await Api.post('fieldtrip/chart/', body, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  } catch (error) {
    throw new Error((error as any).response?.data?.detail || (error as any).message)
  }
}

export default registerHealthLogView
