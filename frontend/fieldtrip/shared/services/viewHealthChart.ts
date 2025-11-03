import AsyncStorage from '@react-native-async-storage/async-storage'
import { Api } from '../api/ApiConfig'

interface ViewHealthChartRequest {
  viewer: number
  owner: number | null
  fieldtrip: number
}

interface EmergencyContact {
  name: string
  phone: string
}

interface ViewHealthChartResponse {
  fullName: string
  bloodType: string
  medAllergies: string[]
  substanceAllergies: string[]
  emergencyContact: EmergencyContact
}

const viewHealthChart = async (body: ViewHealthChartRequest): Promise<ViewHealthChartResponse> => {
  try {
    const token = await AsyncStorage.getItem('access_token')
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

export default viewHealthChart
