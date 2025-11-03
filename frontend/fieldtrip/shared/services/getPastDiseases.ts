import AsyncStorage from '@react-native-async-storage/async-storage'
import { Api } from '../api/ApiConfig'
import type ChecklistItem from '../../types/ChecklistItem'

const getPastDiseases = async (): Promise<ChecklistItem[]> => {
  try {
    const token = await AsyncStorage.getItem('access_token')
    const response = await Api.get('health/past/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  } catch (error) {
    console.log(error)
    return []
  }
}

export default getPastDiseases
