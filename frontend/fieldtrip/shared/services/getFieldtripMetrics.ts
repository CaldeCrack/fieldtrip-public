import AsyncStorage from '@react-native-async-storage/async-storage'
import { Api } from '../api/ApiConfig'

interface Allergy {
  name: string
  count: number
}

interface Disease {
  name: string
  count: number
}

interface FieldtripMetrics {
  diseases?: Disease[]
  allergies?: Allergy[]
}

const getFieldtripMetrics = async (id: number): Promise<FieldtripMetrics> => {
  try {
    const token = await AsyncStorage.getItem('access_token')
    const response = await Api.get(`fieldtrip/${id}/metrics/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  } catch (error) {
    throw new Error((error as any).response?.data?.detail || (error as any).message)
  }
}

export default getFieldtripMetrics
