import { Api } from '../api/ApiConfig'

const getSubstanceAllergies = async () => {
  try {
    const response = await Api.get('user/substance-allergy/')
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export default getSubstanceAllergies
