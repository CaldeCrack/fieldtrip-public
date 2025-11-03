import { Api } from '../api/ApiConfig'

interface SubstanceAllergy {
  id: number
  type: string
}

const getSubstanceAllergies = async (): Promise<SubstanceAllergy[]> => {
  try {
    const response = await Api.get('user/substance-allergy/')
    return response.data
  } catch (error) {
    console.log(error)
    return []
  }
}

export default getSubstanceAllergies
