import AsyncStorage from '@react-native-async-storage/async-storage'

import { Api } from '../api/ApiConfig'
import { EquipmentItem } from '@types'

type UpdateEducationalInstitutionEquipmentPayload = {
  equipment_id: number
  quantity: number
}

const updateEducationalInstitutionEquipment = async (
  institutionId: number,
  payload: UpdateEducationalInstitutionEquipmentPayload,
): Promise<EquipmentItem> => {
  try {
    const token = await AsyncStorage.getItem('access_token')
    const response = await Api.patch<EquipmentItem>(
      `equipment/institution/${institutionId}/`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    return response.data
  } catch (error) {
    throw new Error((error as any).response?.data?.detail || (error as any).message)
  }
}

export default updateEducationalInstitutionEquipment
