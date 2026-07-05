import React from 'react'
import { MD3Colors, TextInput as PaperTextInput } from 'react-native-paper'
import { Platform, StyleSheet, View } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { COLORS } from '@colors'
import type { TextInputProps } from 'react-native-paper'

type IconInputProps = TextInputProps & {
  iconName: string
}

const IconInput = ({ iconName, label, accessibilityLabel, value, onChangeText, secureTextEntry, onSubmitEditing, ...rest }: IconInputProps) => {
  const resolvedLabel = typeof label === 'string' ? label : undefined
  const resolvedAccessibilityLabel = accessibilityLabel ?? resolvedLabel
  const inputId = React.useRef(`icon-input-${Math.random().toString(36).slice(2)}`).current

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webField}>
        {resolvedLabel ? (
          <label htmlFor={inputId} style={styles.webLabel}>
            {resolvedLabel}
          </label>
        ) : null}
        <input
          id={inputId}
          aria-label={resolvedAccessibilityLabel}
          type={secureTextEntry ? 'password' : 'text'}
          value={value ?? ''}
          onChange={(event) => onChangeText?.(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && onSubmitEditing) {
              onSubmitEditing({ nativeEvent: { text: (event.target as HTMLInputElement).value } } as never)
            }
          }}
          style={styles.webInput as never}
          {...(rest as never)}
        />
      </View>
    )
  }

  return (
    <PaperTextInput
      mode="outlined"
      style={styles.input}
      label={label}
      accessibilityLabel={resolvedAccessibilityLabel}
      accessibilityRole="textbox"
      accessible
      theme={{
        roundness: 4,
        colors: {
          primary: MD3Colors.primary50,
        },
      }}
      outlineColor={COLORS.gray_100}
      left={
        <PaperTextInput.Icon
          icon={() => <Icon name={iconName} size={24} color="black" style={styles.icon} />}
          forceTextInputFocus
          tabIndex={-1}
        />
      }
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      onSubmitEditing={onSubmitEditing}
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
  },
  webField: {
    marginBottom: 14,
    width: 300,
  },
  webLabel: {
    display: 'block',
    marginBottom: 6,
    fontSize: 14,
    color: COLORS.primary_50,
  },
  webInput: {
    width: '100%',
    height: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.gray_100,
    borderRadius: 4,
    backgroundColor: '#fff',
    fontSize: 16,
  },
})

export default IconInput
