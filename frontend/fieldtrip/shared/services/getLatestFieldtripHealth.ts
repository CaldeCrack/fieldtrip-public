import AsyncStorage from '@react-native-async-storage/async-storage'
import { Api } from '../api/ApiConfig'
import type HealthInfo from '../../types/HealthInfo'

interface FieldtripHealth {
  health_general: HealthInfo[]
  health_specific: HealthInfo[]
}

const getLatestFieldtripHealth = async (): Promise<FieldtripHealth> => {
  try {
    const token = await AsyncStorage.getItem('access_token')
    const response = await Api.get('fieldtrip/latest-health/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  } catch (error) {
    throw new Error((error as any).response?.data?.detail || (error as any).message)
  }
}

export default getLatestFieldtripHealth
