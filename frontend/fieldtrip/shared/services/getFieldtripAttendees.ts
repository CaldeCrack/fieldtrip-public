import AsyncStorage from '@react-native-async-storage/async-storage'
import { Api } from '../api/ApiConfig'

interface StudentAttendee {
  id: number
  name: string
  signupComplete?: boolean
  fieldtripID?: number
}

const getFieldtripAttendees = async (id: number): Promise<StudentAttendee[]> => {
  try {
    const token = await AsyncStorage.getItem('access_token')
    const response = await Api.get(`fieldtrip/${id}/attendees/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  } catch (error) {
    throw new Error((error as any).response?.data?.detail || (error as any).message)
  }
}

export default getFieldtripAttendees
