import { Text } from 'react-native-paper'
import { StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'

import { Page, ContainedButton } from '@components'

const NotFound = () => {
  const router = useRouter()

  return (
    <Page style={styles.page}>
      <View style={styles.content}>
        <Text variant="bodyLarge" style={styles.text}>
          La página que estás buscando no existe.
        </Text>
      </View>

      <ContainedButton
        style={styles.button}
        labelStyle={{ fontSize: 18, lineHeight: 20 }}
        onPress={() => router.replace('/')}
      >
        Volver al inicio
      </ContainedButton>
    </Page>
  )
}

const styles = StyleSheet.create({
  page: {
    alignItems: 'center',
    maxWidth: 600,
    paddingHorizontal: 16,
  },
  content: {
    alignItems: 'center',
    marginBottom: 40,
  },
  text: {
    marginTop: 250,
    textAlign: 'center',
  },
  button: {
    marginTop: 30,
    width: 250,
  },
})

export default NotFound
