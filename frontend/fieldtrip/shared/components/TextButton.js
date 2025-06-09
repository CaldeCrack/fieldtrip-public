import { Button } from 'react-native-paper'
import { StyleSheet } from 'react-native'

const TextButton = (props) => {
  const { ...rest } = props
  return <Button labelStyle={styles.label} {...rest} />
}

const styles = StyleSheet.create({
  label: {
    fontSize: 16,
    fontWeight: 400,
    marginHorizontal: 5,
    marginVertical: 10,
  },
})

export default TextButton
