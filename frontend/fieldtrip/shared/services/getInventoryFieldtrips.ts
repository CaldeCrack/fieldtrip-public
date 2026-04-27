import AsyncStorage from '@react-native-async-storage/async-storage'

import { Api } from '../api/ApiConfig'
import FieldtripItem from 'types/FieldtripItem'

const getInventoryFieldtrips = async (): Promise<FieldtripItem[]> => {
  try {
    const token = await AsyncStorage.getItem('access_token')
    const response = await Api.get<FieldtripItem[]>(`fieldtrip/inventory/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return response.data
  } catch (error) {
    throw new Error((error as any).response?.data?.detail || (error as any).message)
  }
}

export default getInventoryFieldtrips