import { StyleSheet, View } from 'react-native'
import { Surface, Text, TouchableRipple } from 'react-native-paper'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

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
            <View style={styles.cardRow}>
              <View style={styles.iconWrap}>
                <Icon name="school-outline" size={22} color={COLORS.primary_50} />
              </View>
              <View style={styles.textWrap}>
                <Text variant="titleMedium" style={styles.title}>
                  {item.name}
                </Text>
                {item.address ? <Text variant="bodyMedium">{item.address}</Text> : null}
              </View>
            </View>
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
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primary_25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
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
