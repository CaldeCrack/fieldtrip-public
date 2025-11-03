import AsyncStorage from '@react-native-async-storage/async-storage'
import { Api } from '../api/ApiConfig'

interface HealthLogViewRequest {
  viewer: number
  owner: number
  fieldtrip: number
}

interface HealthLogViewResponse {
  [key: string]: string | number | boolean
}

const registerHealthLogView = async (
  body: HealthLogViewRequest,
): Promise<HealthLogViewResponse> => {
  try {
    const token = await AsyncStorage.getItem('access_token')
    const response = await Api.post(
      'health-log/',
      JSON.stringify({
        body,
      }),
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )
    return response.data
  } catch (error) {
    throw new Error((error as any).response?.data?.detail || (error as any).message)
  }
}

export default registerHealthLogView
