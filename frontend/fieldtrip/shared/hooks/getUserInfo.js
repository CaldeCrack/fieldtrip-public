import { useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { jwtDecode } from 'jwt-decode'

const useUserInfo = () => {
  const [userInfo, setUserInfo] = useState({
    userID: '',
    /*
    names: '',
    surnames: '',
    RUT: '',
    diet: '',
    bloodType: '',
    medAllergies: [],
    substanceAllergies: [],
    is_teacher: false,
    is_student: false,
    is_staff: false,*/
  })

  useEffect(() => {
    const loadUserInfo = async () => {
      const token = await AsyncStorage.getItem('access_token')
      if (!token) return

      const jwt = jwtDecode(token)
      setUserInfo({
        userID: jwt['user_id'],
      })
    }

    loadUserInfo()
  }, [])

  return userInfo
}

export default useUserInfo
