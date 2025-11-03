import { jwtDecode } from 'jwt-decode'
import type Payload from '../../types/Payload'

const getTokenData = (token: string): Payload => {
  return jwtDecode<Payload>(token)
}

export default getTokenData
