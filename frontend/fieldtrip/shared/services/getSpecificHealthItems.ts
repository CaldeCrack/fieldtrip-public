import AsyncStorage from '@react-native-async-storage/async-storage'
import { Api } from '../api/ApiConfig'

interface SpecificHealthItem {
  id: number
  item: string
  checked: boolean
}

const getSpecificHealthItems = async (): Promise<SpecificHealthItem[]> => {
  try {
    const token = await AsyncStorage.getItem('access_token')
    const response = await Api.get('health/specific/', {
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

export default getSpecificHealthItems
