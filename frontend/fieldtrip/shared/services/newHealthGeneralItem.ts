import AsyncStorage from '@react-native-async-storage/async-storage'
import { Api } from '../api/ApiConfig'

interface NewHealthGeneralItemRequest {
  item: string
  situation: 1 | 2
}

interface HealthGeneralItemResponse {
  id: number
  item: string
  situation: 1 | 2
}

const newHealthGeneralItem = async (
  body: NewHealthGeneralItemRequest,
): Promise<HealthGeneralItemResponse> => {
  try {
    const token = await AsyncStorage.getItem('access_token')
    const response = await Api.post('health/general/', body, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  } catch (error) {
    throw new Error((error as any).response?.data?.detail || (error as any).message)
  }
}

export default newHealthGeneralItem
