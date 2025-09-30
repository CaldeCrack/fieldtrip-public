import { jwtDecode } from 'jwt-decode'

const getTokenData = (token) => {
  return jwtDecode(token)
}

export default getTokenData
