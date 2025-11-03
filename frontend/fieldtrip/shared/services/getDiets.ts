import { Api } from '../api/ApiConfig'

interface Diet {
  id: number
  type: string
}

const getDiets = async (): Promise<Diet[]> => {
  try {
    const response = await Api.get('user/diet/')
    return response.data
  } catch (error) {
    console.log(error)
    return []
  }
}

export default getDiets
