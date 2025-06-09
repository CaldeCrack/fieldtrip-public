import { Api } from '../api/ApiConfig'

export default getSubstanceAllergies = async () => {
  try {
    const response = await Api.get(`user/substance-allergy/`)
    return response.data
  } catch (error) {
    console.log(error)
  }
}
