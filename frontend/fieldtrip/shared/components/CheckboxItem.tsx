import { Checkbox } from 'react-native-paper'
import { StyleSheet } from 'react-native'
import { COLORS } from '@colors'
import type { CheckboxProps } from 'react-native-paper'

const CheckboxItem = (props: CheckboxProps) => {
  const { ...rest } = props

  return (
    <Checkbox.Item
      uncheckedColor={COLORS.gray_100}
      style={styles.checkbox}
      labelStyle={styles.label}
      {...(rest as any)}
    />
  )
}

const styles = StyleSheet.create({
  checkbox: {
    paddingLeft: 8,
    paddingRight: 0,
    paddingVertical: 2,
  },
  label: {
    marginRight: 5,
    padding: 0,
  },
})

export default CheckboxItem
