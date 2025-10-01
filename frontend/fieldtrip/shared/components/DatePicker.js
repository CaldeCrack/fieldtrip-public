import { MD3Colors } from 'react-native-paper'
import { StyleSheet, Dimensions } from 'react-native'
import { DatePickerInput } from 'react-native-paper-dates'
import { COLORS } from '@colors'

const DatePicker = (props) => {
  const { ...rest } = props

  return (
    <DatePickerInput
      locale="en"
      inputMode="start"
      style={styles.datePicker}
      mode="outlined"
      theme={{
        roundness: 4,
        colors: {
          primary: MD3Colors.primary50,
        },
      }}
      outlineColor={COLORS.gray_100}
      {...rest}
    />
  )
}

const styles = StyleSheet.create({
  datePicker: {
    height: 48,
    width: Math.min(Dimensions.get('window').width - 32, 568),
    marginBottom: 14,
    backgroundColor: MD3Colors.primary100,
  },
})

export default DatePicker
