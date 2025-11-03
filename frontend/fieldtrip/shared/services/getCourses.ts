import AsyncStorage from '@react-native-async-storage/async-storage'
import { Api } from '../api/ApiConfig'

interface Course {
  id: number
  name: string
}

const getCourses = async (): Promise<Course[]> => {
  try {
    const token = await AsyncStorage.getItem('access_token')
    const response = await Api.get('course/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  } catch (error) {
    console.log(error)
    return []
  }
}

export default getCourses
