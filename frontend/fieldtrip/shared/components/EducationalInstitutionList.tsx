import { StyleSheet, View } from 'react-native'
import { Surface, Text, TouchableRipple } from 'react-native-paper'

import { COLORS } from '@colors'

type EducationalInstitution = {
  id: number
  name: string
  address?: string
}

type Props = {
  data: EducationalInstitution[]
}

const EducationalInstitutionList = ({ data }: Props) => {
  if (data.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text>No hay instituciones educativas para mostrar.</Text>
      </View>
    )
  }

  return (
    <View style={styles.list}>
      {data.map((item) => (
        <TouchableRipple key={String(item.id)} style={styles.ripple} onPress={() => {}}>
          <Surface elevation={0} style={styles.card}>
            <Text variant="titleMedium" style={styles.title}>
              {item.name}
            </Text>
            {item.address ? <Text variant="bodyMedium">{item.address}</Text> : null}
          </Surface>
        </TouchableRipple>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  list: {
    width: '100%',
  },
  ripple: {
    borderRadius: 10,
    minWidth: 320,
    flex: 1,
    marginBottom: 16,
  },
  card: {
    borderRadius: 10,
    minWidth: 320,
    borderWidth: 1,
    borderColor: COLORS.gray_100,
    flexDirection: 'column',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  title: {
    fontWeight: '600',
  },
  emptyState: {
    width: 300,
    marginTop: 24,
  },
})

export default EducationalInstitutionList
