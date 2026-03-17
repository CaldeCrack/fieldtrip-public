import React, { useMemo, useState } from 'react'
import { MD3Colors, Portal, Snackbar } from 'react-native-paper'
import { SnackbarContext } from './GlobalSnackbarStore'

type SnackbarOptions = {
  isError?: boolean
  duration?: number
}

type Props = {
  children: React.ReactNode
}

export const GlobalSnackbarProvider = ({ children }: Props) => {
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [duration, setDuration] = useState(3000)

  const showSnackbar = (nextMessage: string, options?: SnackbarOptions) => {
    setMessage(nextMessage)
    setIsError(!!options?.isError)
    setDuration(options?.duration ?? 3000)
    setVisible(true)
  }

  const value = useMemo(
    () => ({
      showSnackbar,
    }),
    [],
  )

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Portal>
        <Snackbar
          visible={visible}
          onDismiss={() => setVisible(false)}
          duration={duration}
          style={{ backgroundColor: isError ? MD3Colors.error50 : MD3Colors.primary50 }}
        >
          {message}
        </Snackbar>
      </Portal>
    </SnackbarContext.Provider>
  )
}
