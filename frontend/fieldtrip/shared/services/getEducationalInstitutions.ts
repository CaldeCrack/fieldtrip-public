import AsyncStorage from '@react-native-async-storage/async-storage'

import { Api } from '../api/ApiConfig'
import { EducationalInstitutionItem } from '@types'

const getEducationalInstitutions = async (): Promise<EducationalInstitutionItem[]> => {
  try {
    const token = await AsyncStorage.getItem('access_token')
    const response = await Api.get<EducationalInstitutionItem[]>('educational-institution/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return response.data || []
  } catch (error) {
    throw new Error((error as any).response?.data?.detail || (error as any).message)
  }
}

export default getEducationalInstitutions
