import AsyncStorage from '@react-native-async-storage/async-storage'
import { Api } from '../api/ApiConfig'

interface HealthLogEntry {
  id: number
  timestamp: Date
  viewer: number
  fieldtrip: number
}

const getHealthLog = async (id: number): Promise<HealthLogEntry[]> => {
  try {
    const token = await AsyncStorage.getItem('access_token')
    const response = await Api.get(`health/log-data/user/?user-id=${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  } catch (error) {
    throw new Error((error as any).response?.data?.detail || (error as any).message)
  }
}

export default getHealthLog
