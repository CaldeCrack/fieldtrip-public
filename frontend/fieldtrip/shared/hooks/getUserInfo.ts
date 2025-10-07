import { useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { jwtDecode } from 'jwt-decode'

type UserInfo = {
  userID: string | number | null
}

const useUserInfo = (): UserInfo => {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    userID: null,
  })

  useEffect(() => {
    const loadUserInfo = async () => {
      const token = await AsyncStorage.getItem('access_token')
      if (!token) return

      try {
        const jwt: any = jwtDecode(token)
        setUserInfo({
          userID: jwt['user_id'],
        })
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err)
      }
    }

    loadUserInfo()
  }, [])

  return userInfo
}

export default useUserInfo
