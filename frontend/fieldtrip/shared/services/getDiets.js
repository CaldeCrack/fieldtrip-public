import { Api } from '../api/ApiConfig'

const getDiets = async () => {
  try {
    const response = await Api.get('user/diet/')
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export default getDiets
