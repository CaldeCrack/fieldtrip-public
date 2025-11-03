import AsyncStorage from '@react-native-async-storage/async-storage'
import { Api } from '../api/ApiConfig'

interface FieldtripItem {
  id: number
  title: string
  professor?: string
  startDate: string
  endDate: string
  invitationCode?: string
}

const getUsersFieldtrips = async (id: string | number): Promise<FieldtripItem[]> => {
  try {
    const token = await AsyncStorage.getItem('access_token')
    const response = await Api.get(`/fieldtrip-attendee/user/?user-id=${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  } catch (error) {
    throw new Error((error as any).response?.data?.detail || (error as any).message)
  }
}

export default getUsersFieldtrips
