import { jwtDecode } from "jwt-decode"

export default getTokenData = (token) => {
  return jwtDecode(token)
}
