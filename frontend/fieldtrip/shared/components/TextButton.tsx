import { Button } from 'react-native-paper'
import { StyleSheet, TextStyle } from 'react-native'
import type { ButtonProps } from 'react-native-paper'

type Props = ButtonProps & { style?: TextStyle }

const TextButton = (props: Props) => {
  const { style, labelStyle, ...rest } = props
  const mergedLabelStyle = [styles.label, labelStyle, style]
  return <Button labelStyle={mergedLabelStyle} {...rest} />
}

const styles = StyleSheet.create({
  label: {
    fontSize: 16,
    fontWeight: 400,
    marginHorizontal: 5,
    marginVertical: 10,
  } as TextStyle,
})

export default TextButton
