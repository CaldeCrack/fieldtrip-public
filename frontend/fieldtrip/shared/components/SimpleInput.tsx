import React from 'react'
import { MD3Colors, TextInput as PaperTextInput } from 'react-native-paper'
import { Platform, StyleSheet, View } from 'react-native'
import { COLORS } from '@colors'
import type { TextInputProps } from 'react-native-paper'

const SimpleInput = (props: TextInputProps) => {
  const { label, accessibilityLabel, value, onChange, onChangeText, secureTextEntry, ...rest } = props
  const resolvedLabel = typeof label === 'string' ? label : undefined
  const resolvedAccessibilityLabel = accessibilityLabel ?? resolvedLabel
  const inputId = React.useRef(`simple-input-${Math.random().toString(36).slice(2)}`).current

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
          onChange={(event) => {
            onChange?.({ nativeEvent: { text: event.target.value } } as never)
            onChangeText?.(event.target.value)
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
          primary: COLORS.primary_50,
        },
      }}
      outlineColor={COLORS.gray_100}
      value={value}
      onChange={onChange}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
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
  webField: {
    marginBottom: 14,
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

export default SimpleInput
