import { useContext } from 'react'

import { SnackbarContext } from './GlobalSnackbarStore'

export const useGlobalSnackbar = () => useContext(SnackbarContext)
