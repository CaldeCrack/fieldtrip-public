import { Api } from '../api/ApiConfig'

const getMedAllergies = async () => {
  try {
    const response = await Api.get('user/med-allergy/')
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export default getMedAllergies
