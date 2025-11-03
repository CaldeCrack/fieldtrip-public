import { Api } from '../api/ApiConfig'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type ChecklistItem from '../../types/ChecklistItem'

const getChecklist = async (fieldtripId: number | null): Promise<ChecklistItem[]> => {
  try {
    const token = await AsyncStorage.getItem('access_token')
    const response = await Api.get(`checklist/?fieldtrip_id=${fieldtripId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  } catch (error) {
    console.error(
      'Error fetching checklist:',
      (error as any).response?.data || (error as any).message,
    )
    throw error
  }
}

export default getChecklist
