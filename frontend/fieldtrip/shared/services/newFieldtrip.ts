import AsyncStorage from '@react-native-async-storage/async-storage'
import { Api } from '../api/ApiConfig'

interface NewFieldtripRequest {
  name: string
  sector: string
  teacher_id: string | undefined
  course_id: string | undefined
  start_date: string
  end_date: string
}

interface NewFieldtripResponse {
  id: number
}

const newFieldtrip = async (body: NewFieldtripRequest): Promise<NewFieldtripResponse> => {
  try {
    const token = await AsyncStorage.getItem('access_token')
    const response = await Api.post('fieldtrip/', body, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  } catch (error) {
    throw new Error((error as any).response?.data?.detail || (error as any).message)
  }
}

export default newFieldtrip
