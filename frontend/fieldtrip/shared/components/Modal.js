import { Dimensions, StyleSheet } from 'react-native'
import { Portal, Dialog, Text } from 'react-native-paper'

const Modal = (props) => {
  const { visible, close, title, description, children } = props
  const isSmallScreen = Dimensions.get('window').width <= 768;

  return (
    <Portal>
      <Dialog onDismiss={close} visible={visible} style={[styles.modal, isSmallScreen && styles.smallScreenContainer]}>
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
    padding: 0
  },
  smallScreenContainer: {
    marginHorizontal: 8,
  },
  content: {
    alignItems: 'center',
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
