import { Checkbox } from 'react-native-paper'
import { StyleSheet } from 'react-native'
import { COLORS } from '@colors'

const CheckboxItem = (props) => {
  const { ...rest } = props

  return (
    <Checkbox.Item
      uncheckedColor={COLORS.gray_100}
      style={styles.checkbox}
      labelStyle={styles.label}
      {...rest}
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
