import { Button } from 'react-native-paper'
import { StyleSheet } from 'react-native'
import type { ButtonProps } from 'react-native-paper'

const ContainedButton = (props: ButtonProps) => {
  const { ...rest } = props
  return (
    <Button
      mode="contained"
      labelStyle={styles.label}
      style={styles.btn}
      {...(rest as any)}
    />
  )
}

const styles = StyleSheet.create({
  label: {
    fontSize: 16,
  },
  btn: {
    justifyContent: 'center',
    width: 'auto',
    borderRadius: 50,
    marginBottom: 16,
  },
})

export default ContainedButton
