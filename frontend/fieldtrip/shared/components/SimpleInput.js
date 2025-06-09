import { MD3Colors, TextInput } from 'react-native-paper'
import { StyleSheet } from 'react-native'
import { COLORS } from '../../styles/colors'

const SimpleInput = (props) => {
  const { ...rest } = props
  return (
    <TextInput
      mode="outlined"
      style={styles.input}
      theme={{
        roundness: 4,
        colors: {
          primary: COLORS.primary_50
        }
      }}
      outlineColor={COLORS.gray_100}
      {...rest}
    />
  )
}

const styles = StyleSheet.create({
  input: {
    fontSize: 16,
    height: 48,
    marginBottom: 14,
    backgroundColor: MD3Colors.primary100,
  },
})

export default SimpleInput
