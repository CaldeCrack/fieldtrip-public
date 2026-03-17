import React, { useMemo, useState } from 'react'
import { useWindowDimensions } from 'react-native'
import { MD3Colors, Portal, Snackbar } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SnackbarContext } from './GlobalSnackbarStore'

type SnackbarOptions = {
  isError?: boolean
  duration?: number
}

type Props = {
  children: React.ReactNode
}

export const GlobalSnackbarProvider = ({ children }: Props) => {
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [duration, setDuration] = useState(3000)

  const isWideScreen = width >= 900
  const snackbarWidth = isWideScreen ? width * 0.5 : Math.min(width - 24, 600)
  const snackbarBottom = 72 + insets.bottom

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
          action={{
            label: 'X',
            onPress: () => setVisible(false),
          }}
          wrapperStyle={{
            bottom: snackbarBottom,
            alignItems: 'center',
          }}
          style={{
            width: snackbarWidth,
            backgroundColor: isError ? MD3Colors.error50 : MD3Colors.primary50,
          }}
        >
          {message}
        </Snackbar>
      </Portal>
    </SnackbarContext.Provider>
  )
}
