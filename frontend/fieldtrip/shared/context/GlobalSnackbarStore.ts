import { createContext } from 'react'

type SnackbarOptions = {
  isError?: boolean
  duration?: number
}

export type SnackbarContextType = {
  showSnackbar: (_message: string, _options?: SnackbarOptions) => void
}

export const SnackbarContext = createContext<SnackbarContextType>({
  showSnackbar: (_message: string, _options?: SnackbarOptions) => {},
})
