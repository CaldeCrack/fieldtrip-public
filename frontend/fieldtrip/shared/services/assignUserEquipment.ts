import AsyncStorage from '@react-native-async-storage/async-storage'

import { Api } from '../api/ApiConfig'

interface AssignUserEquipmentBody {
  user_id: number
  equipment: { id: number; quantity: number }[]
}

const assignUserEquipment = async (
  fieldtripId: number,
  userId: number,
  equipment: { id: number; quantity: number }[],
): Promise<any> => {
  try {
    const token = await AsyncStorage.getItem('access_token')
    const body: AssignUserEquipmentBody = {
      user_id: userId,
      equipment,
    }

    const response = await Api.post(`fieldtrip/${fieldtripId}/user-equipment/`, body, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return response.data
  } catch (error) {
    throw new Error((error as any).response?.data?.detail || (error as any).message)
  }
}

export default assignUserEquipment
