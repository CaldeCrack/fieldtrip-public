import { useEffect, useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Divider, IconButton, List, Text } from 'react-native-paper'
import { useRouter } from 'expo-router'

import { ConfirmationModal, ContainedButton, Page } from '@components'
import {
  deleteFieldtripOfflineData,
  enqueueHealthLogView,
  getFieldtripOfflineData,
  initOfflineDb,
  listOfflineFieldtrips,
  OfflineFieldtripData,
  OfflineFieldtripSummary,
} from '../../shared/storage/offlineFieldtripDb'

const OfflineFieldtrips = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [summaries, setSummaries] = useState<OfflineFieldtripSummary[]>([])
  const [selected, setSelected] = useState<OfflineFieldtripData | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [healthExpanded, setHealthExpanded] = useState<Record<number, boolean>>({})
  const [queuedHealthLogs, setQueuedHealthLogs] = useState<Record<number, boolean>>({})
  const [deleteTarget, setDeleteTarget] = useState<OfflineFieldtripSummary | null>(null)

  const loadSummaries = async () => {
    setLoading(true)
    setLoadError(false)
    try {
      await initOfflineDb()
      const data = await listOfflineFieldtrips()
      setSummaries(data)
    } catch (error) {
      console.warn('No se pudieron cargar las salidas offline:', error)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSummaries()
  }, [])

  const handleSelect = async (fieldtripId: number) => {
    try {
      await initOfflineDb()
      const data = await getFieldtripOfflineData(fieldtripId)
      setSelected(data)
    } catch (error) {
      console.warn('No se pudo cargar la salida offline:', error)
      setSelected(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await initOfflineDb()
      await deleteFieldtripOfflineData(deleteTarget.fieldtripId)
      setSummaries((prev) => prev.filter((s) => s.fieldtripId !== deleteTarget.fieldtripId))
    } catch (error) {
      console.warn('No se pudo eliminar la descarga:', error)
    } finally {
      setDeleteTarget(null)
    }
  }

  const healthByUser = useMemo(() => selected?.healthByUser || {}, [selected?.healthByUser])

  const handleToggleHealth = async (attendeeId: number) => {
    const nextExpanded = !healthExpanded[attendeeId]
    setHealthExpanded((prev) => ({ ...prev, [attendeeId]: nextExpanded }))

    if (!nextExpanded || queuedHealthLogs[attendeeId]) {
      return
    }

    if (!selected?.downloadedByUserId) {
      return
    }

    try {
      await initOfflineDb()
      await enqueueHealthLogView({
        viewer_id: selected.downloadedByUserId,
        owner: attendeeId,
        fieldtrip_id: selected.fieldtripId,
      })
      setQueuedHealthLogs((prev) => ({ ...prev, [attendeeId]: true }))
    } catch (error) {
      console.warn('No se pudo encolar la ficha de salud:', error)
    }
  }

  return (
    <Page style={styles.page} showTabs={false}>
      <View style={styles.headerRow}>
        <Text variant="headlineSmall" style={styles.title}>
          Modo sin conexion
        </Text>
        <ContainedButton onPress={() => router.replace('/login')}>Iniciar sesion</ContainedButton>
      </View>

      {selected ? (
        <View style={styles.section}>
          <ContainedButton style={styles.backButton} onPress={() => setSelected(null)}>
            Volver a descargas
          </ContainedButton>

          <Text variant="titleLarge" style={styles.sectionTitle}>
            {selected.fieldtripName}
          </Text>
          <Text style={styles.subtleText}>Descargado: {selected.downloadedAt}</Text>

          <Divider style={styles.divider} />

          <List.Section>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Asistentes
            </Text>
            {selected.attendees.length === 0 ? (
              <Text style={styles.subtleText}>No hay asistentes en esta descarga.</Text>
            ) : (
              selected.attendees.map((attendee) => {
                const status = attendee.isAuxiliar
                  ? 'Auxiliar'
                  : attendee.isGroupLeader
                    ? 'Lider de grupo'
                    : attendee.signupComplete
                      ? 'Inscrito'
                      : 'Sin inscripcion'

                return (
                  <List.Item key={String(attendee.id)} title={attendee.name} description={status} />
                )
              })
            )}
          </List.Section>

          <Divider style={styles.divider} />

          <List.Section>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Solicitudes de equipamiento
            </Text>
            {selected.equipmentRequests.length === 0 ? (
              <Text style={styles.subtleText}>No hay solicitudes guardadas.</Text>
            ) : (
              selected.equipmentRequests.map((request) => (
                <List.Item
                  key={String(request.id)}
                  title={request.name}
                  description={`Cantidad: ${request.quantity} · Estado: ${request.status}`}
                />
              ))
            )}
          </List.Section>

          <Divider style={styles.divider} />

          <List.Section>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Ficha de salud
            </Text>
            {selected.attendees.length === 0 ? (
              <Text style={styles.subtleText}>No hay asistentes para mostrar.</Text>
            ) : (
              selected.attendees.map((attendee) => {
                const healthData = healthByUser[attendee.id]
                const constant = healthData?.constant
                const fieldtrip = healthData?.fieldtrip
                const isQueued = !!queuedHealthLogs[attendee.id]

                return (
                  <List.Accordion
                    key={String(attendee.id)}
                    title={attendee.name}
                    onPress={() => void handleToggleHealth(attendee.id)}
                    description={
                      isQueued ? 'Vista pendiente de sincronizar' : 'Abrir ficha de salud offline'
                    }
                  >
                    {!constant && !fieldtrip ? (
                      <List.Item title="No hay datos de salud guardados." />
                    ) : (
                      <>
                        {constant ? (
                          <>
                            <List.Item
                              title="Tipo sanguineo"
                              description={constant.bloodType || 'Sin datos'}
                            />
                            <List.Item
                              title="Contacto de emergencia"
                              description={`${constant.emergencyContact?.name || 'Sin datos'} (${constant.emergencyContact?.phone || '-'})`}
                            />
                            <List.Item
                              title="Alergias a medicamentos"
                              description={
                                constant.medAllergies?.length
                                  ? constant.medAllergies.join(', ')
                                  : 'Sin datos'
                              }
                            />
                            <List.Item
                              title="Alergias a sustancias"
                              description={
                                constant.substanceAllergies?.length
                                  ? constant.substanceAllergies.join(', ')
                                  : 'Sin datos'
                              }
                            />
                            <List.Item
                              title="Seguro Escolar"
                              description={
                                constant.preferredMedicalInstitution
                                  ? 'Renuncia al Seguro Escolar'
                                  : 'Usa el Seguro Escolar'
                              }
                            />
                            {constant.preferredMedicalInstitution ? (
                              <List.Item
                                title="Institución médica preferida"
                                description={constant.preferredMedicalInstitution}
                              />
                            ) : null}
                          </>
                        ) : (
                          <List.Item title="Datos generales no disponibles." />
                        )}
                        {fieldtrip ? (
                          <>
                            <List.Item
                              title="Ha presentado"
                              description={
                                fieldtrip.hasPresented?.length
                                  ? fieldtrip.hasPresented.join(', ')
                                  : 'Sin datos'
                              }
                            />
                            <List.Item
                              title="Padece"
                              description={
                                fieldtrip.presents?.length
                                  ? fieldtrip.presents.join(', ')
                                  : 'Sin datos'
                              }
                            />
                            {fieldtrip.healthSpecific?.length ? (
                              fieldtrip.healthSpecific.map((item, index) => (
                                <List.Item
                                  key={String(index)}
                                  title={item.item}
                                  description={item.value}
                                />
                              ))
                            ) : (
                              <List.Item title="Sin datos especificos." />
                            )}
                          </>
                        ) : (
                          <List.Item title="Datos del paseo no disponibles." />
                        )}
                      </>
                    )}
                  </List.Accordion>
                )
              })
            )}
          </List.Section>
        </View>
      ) : loading ? (
        <Text style={styles.subtleText}>Cargando descargas...</Text>
      ) : loadError ? (
        <Text style={styles.subtleText}>No se pudieron cargar los datos offline.</Text>
      ) : summaries.length === 0 ? (
        <Text style={styles.subtleText}>No hay salidas descargadas.</Text>
      ) : (
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Descargas disponibles
          </Text>
          {summaries.map((summary) => (
            <View key={String(summary.fieldtripId)} style={styles.summaryRow}>
              <List.Item
                style={styles.summaryItem}
                title={summary.fieldtripName}
                description={`Descargado: ${summary.downloadedAt}`}
                onPress={() => void handleSelect(summary.fieldtripId)}
              />
              <IconButton
                icon="delete-outline"
                iconColor="#c0392b"
                size={24}
                onPress={() => setDeleteTarget(summary)}
                accessibilityLabel={`Eliminar descarga de ${summary.fieldtripName}`}
              />
            </View>
          ))}
        </View>
      )}
      <ConfirmationModal
        visible={!!deleteTarget}
        title="Eliminar descarga"
        description={`¿Deseas eliminar "${deleteTarget?.fieldtripName ?? ''}" del almacenamiento del dispositivo? Esta acción no se puede deshacer.`}
        close={() => setDeleteTarget(null)}
        open={() => void handleDelete()}
      />
    </Page>
  )
}

const styles = StyleSheet.create({
  page: {
    maxWidth: 800,
    paddingHorizontal: 16,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: '700',
  },
  section: {
    width: '100%',
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  subtleText: {
    color: '#6b7280',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  summaryItem: {
    flex: 1,
  },
})

export default OfflineFieldtrips
