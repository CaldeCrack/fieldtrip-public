import AsyncStorage from '@react-native-async-storage/async-storage'
import { Api } from '../api/ApiConfig'

const getCourses = async () => {
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
  }
}

export default getCourses
