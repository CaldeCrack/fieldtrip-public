import { MD3Colors, TextInput } from 'react-native-paper'
import { StyleSheet } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { COLORS } from '../@colors'

const IconInput = (props) => {
  const { iconName, ...rest } = props

  return (
    <TextInput
      mode="outlined"
      style={styles.input}
      theme={{
        roundness: 4,
        colors: {
          primary: MD3Colors.primary50,
        },
      }}
      outlineColor={COLORS.gray_100}
      left={
        <TextInput.Icon
          icon={() => (
            <Icon name={iconName} size={24} color="black" style={styles.icon} />
          )}
        />
      }
      {...rest}
    />
  )
}

const styles = StyleSheet.create({
  input: {
    fontSize: 16,
    height: 48,
    width: 300,
    marginBottom: 14,
    backgroundColor: MD3Colors.primary100,
  },
  icon: {
    alignContent: 'center',
    paddingTop: 8,
  },
})

export default IconInput
