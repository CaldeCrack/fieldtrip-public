import AsyncStorage from '@react-native-async-storage/async-storage'

import { Api } from '../api/ApiConfig'

type EquipmentTypeItem = {
  id: number
  name: string
}

interface EquipmentTypesResponse {
  equipment: EquipmentTypeItem[]
}

const getEquipmentTypes = async (query?: string): Promise<EquipmentTypeItem[]> => {
  try {
    const token = await AsyncStorage.getItem('access_token')
    const response = await Api.get<EquipmentTypesResponse>('equipment/types/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: query ? { q: query } : undefined,
    })

    return response.data.equipment || []
  } catch (error) {
    throw new Error((error as any).response?.data?.detail || (error as any).message)
  }
}

export default getEquipmentTypes
