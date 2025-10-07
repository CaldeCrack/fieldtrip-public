import { Dimensions, StyleSheet } from 'react-native'
import { Portal, Dialog, Text } from 'react-native-paper'
import ContainedButton from './ContainedButton'

type ConfirmationModalProps = {
  visible: boolean
  close: () => void
  open: () => void
  title: string
  description?: string
}

const ConfirmationModal = ({
  visible,
  close,
  open,
  title,
  description = '',
}: ConfirmationModalProps) => {
  const isSmallScreen = Dimensions.get('window').width <= 768

  return (
    <Portal>
      <Dialog
        onDismiss={close}
        visible={visible}
        style={[styles.modal, isSmallScreen && styles.smallScreenContainer]}
      >
        <Dialog.Icon icon="alert-circle" color="#00796b" />
        <Dialog.Title style={styles.title}>{title}</Dialog.Title>
        <Dialog.Content style={styles.content}>
          <Text variant="bodyMedium" style={styles.description}>
            {description}
          </Text>
        </Dialog.Content>
        <Dialog.Actions style={styles.actions}>
          <ContainedButton
            onPress={close}
            style={[styles.btn, styles.disagree]}
            labelStyle={{ color: 'black' }}
          >
            NO
          </ContainedButton>
          <ContainedButton
            onPress={open}
            style={[styles.btn, styles.agree]}
            labelStyle={{ color: '#fff' }}
          >
            SI
          </ContainedButton>
        </Dialog.Actions>
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
    borderRadius: 25,
    alignSelf: 'center',
  },
  smallScreenContainer: {
    marginHorizontal: 8,
  },
  title: {
    textAlign: 'center',
    fontSize: 20,
  },
  actions: {
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  description: {
    maxWidth: 450,
  },
  btn: {
    width: 100,
  },
  agree: {
    backgroundColor: 'rgba(127, 103, 190, 1)',
  },
  disagree: {
    marginRight: 50,
    backgroundColor: 'rgb(244, 239, 244)',
  },
})

export default ConfirmationModal
