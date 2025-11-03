import { Api } from '../api/ApiConfig'

interface MedAllergy {
  id: number
  type: string
}

const getMedAllergies = async (): Promise<MedAllergy[]> => {
  try {
    const response = await Api.get('user/med-allergy/')
    return response.data
  } catch (error) {
    console.log(error)
    return []
  }
}

export default getMedAllergies
