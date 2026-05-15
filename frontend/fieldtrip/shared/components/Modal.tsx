import { Dimensions, Platform, StyleSheet } from 'react-native'
import { Portal, Dialog, Text } from 'react-native-paper'
import { useEffect, type ReactNode } from 'react'

type ModalProps = {
  visible: boolean
  close: () => void
  title?: string
  description?: string
  children?: ReactNode
}

const Modal = ({ visible, close, title = '', description = '', children }: ModalProps) => {
  const isSmallScreen = Dimensions.get('window').width <= 768

  useEffect(() => {
    if (!visible || Platform.OS !== 'web') {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [visible, close])

  return (
    <Portal>
      <Dialog
        onDismiss={close}
        visible={visible}
        style={[styles.modal, isSmallScreen && styles.smallScreenContainer]}
      >
        <Dialog.Title style={styles.title}>{title}</Dialog.Title>
        <Dialog.Content style={styles.content}>
          <Text variant="bodyMedium" style={styles.description}>
            {description}
          </Text>
          {children}
        </Dialog.Content>
      </Dialog>
    </Portal>
  )
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: '#fafafa',
    minWidth: 310,
    maxWidth: 500,
    marginHorizontal: 'auto',
    padding: 0,
  },
  smallScreenContainer: {
    marginHorizontal: 8,
  },
  content: {
    alignItems: 'center',
    paddingBottom: 0,
  },
  title: {
    textAlign: 'center',
  },
  description: {
    marginBottom: 16,
    maxWidth: 450,
  },
})

export default Modal
