import AsyncStorage from '@react-native-async-storage/async-storage'

import { Api } from '../api/ApiConfig'
import { EquipmentItem } from '@types'

type CreateEducationalInstitutionEquipmentPayload = {
  name: string
  quantity: number
}

const createEducationalInstitutionEquipment = async (
  institutionId: number,
  payload: CreateEducationalInstitutionEquipmentPayload,
): Promise<EquipmentItem> => {
  try {
    const token = await AsyncStorage.getItem('access_token')
    const response = await Api.post<EquipmentItem>(
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

export default createEducationalInstitutionEquipment
