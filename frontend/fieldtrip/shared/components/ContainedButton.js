import { Button } from 'react-native-paper'
import { StyleSheet } from 'react-native'

const ContainedButton = (props) => {
  const { ...rest } = props
  return (
    <Button
      mode="contained"
      labelStyle={styles.label}
      style={styles.btn}
      {...rest}
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
