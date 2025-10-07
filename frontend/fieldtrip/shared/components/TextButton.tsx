import { Button } from 'react-native-paper'
import { StyleSheet } from 'react-native'
import type { ButtonProps } from 'react-native-paper'

const TextButton = (props: ButtonProps) => {
  const { ...rest } = props
  return <Button labelStyle={styles.label} {...(rest as any)} />
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
