import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { generatePDF } from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import type { HomeStackParamList } from '../navigation/types';
import { Checkbox } from '../components';
import { useLanguage } from '../i18n';
import { useTheme } from '../theme';
import { loadAll, saveAll } from '../storage';
import { formatDate } from '../utils/date';
import { recordToPdfHtml } from '../utils/recordToPdfHtml';
import { recordToCsv } from '../utils/recordToCsv';
import { utf8ToBase64 } from '../utils/base64';
import { generateId } from '../utils/id';
import type { ChecklistRecord, ChecklistGroup, RecordItem, ChecklistItemTemplate } from '../types';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

type Props = NativeStackScreenProps<HomeStackParamList, 'RecordDetail'>;

export function RecordDetailScreen({ route, navigation }: Props) {
  const { recordId } = route.params;
  const { theme, isDark, cardShadow } = useTheme();
  const { t, locale } = useLanguage();
  const [record, setRecord] = useState<ChecklistRecord | null>(null);
  const [group, setGroup] = useState<ChecklistGroup | null>(null);
  const [items, setItems] = useState<Array<{ index: number; title: string; recordItem: RecordItem; template?: ChecklistItemTemplate | null }>>([]);
  const [sharing, setSharing] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [addItemModalVisible, setAddItemModalVisible] = useState(false);
  const [addItemTitle, setAddItemTitle] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editDate, setEditDate] = useState<string | null>(null);
  const [editSubjectName, setEditSubjectName] = useState('');
  const [editOverallNote, setEditOverallNote] = useState('');

  const refresh = useCallback(() => {
    const data = loadAll();
    const r = data.records.find(rec => rec.id === recordId);
    setRecord(r ?? null);
    if (!r) {
      setGroup(null);
      setItems([]);
      return;
    }
    const g = r.groupId ? data.groups.find(gr => gr.id === r.groupId) ?? null : null;
    setGroup(g);
    const templates = r.groupId
      ? data.templates.filter(t => t.groupId === r.groupId).sort((a, b) => a.order - b.order)
      : [];
    const recordItems = data.recordItems.filter(ri => ri.recordId === recordId);
    const withTitle: Array<{ order: number; title: string; recordItem: RecordItem; template?: ChecklistItemTemplate | null }> = [];
    recordItems.forEach(ri => {
      const template = ri.templateItemId ? data.templates.find(t => t.id === ri.templateItemId) ?? null : null;
      const title = ri.customTitle ?? (template?.title ?? '');
      const order = ri.order ?? (ri.templateItemId ? templates.findIndex(t => t.id === ri.templateItemId) : 999);
      withTitle.push({ order: order >= 0 ? order : 999, title, recordItem: ri, template: template ?? undefined });
    });
    withTitle.sort((a, b) => a.order - b.order);
    const combined = withTitle.map((x, idx) => ({ index: idx + 1, title: x.title, recordItem: x.recordItem, template: x.template }));
    setItems(combined);
    setIsFavorite(!!r.isFavorite);
  }, [recordId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const toggleItemCheck = useCallback(
    (recordItem: RecordItem) => {
      const data = loadAll();
      const idx = data.recordItems.findIndex(ri => ri.id === recordItem.id);
      if (idx >= 0) {
        const current = !!data.recordItems[idx].checked;
        data.recordItems[idx] = { ...data.recordItems[idx], checked: !current };
        saveAll(data);
        refresh();
      }
    },
    [refresh]
  );

  const setItemSelection = useCallback(
    (recordItem: RecordItem, optionIndex: number) => {
      const data = loadAll();
      const idx = data.recordItems.findIndex(ri => ri.id === recordItem.id);
      if (idx >= 0) {
        data.recordItems[idx] = {
          ...data.recordItems[idx],
          selectedOptionIndex: optionIndex,
          checked: true,
        };
        saveAll(data);
        refresh();
      }
    },
    [refresh]
  );

  const toggleItemMultiSelection = useCallback(
    (recordItem: RecordItem, optionIndex: number) => {
      const data = loadAll();
      const idx = data.recordItems.findIndex(ri => ri.id === recordItem.id);
      if (idx >= 0) {
        const current = data.recordItems[idx].selectedOptionIndices ?? [];
        const has = current.includes(optionIndex);
        const next = has ? current.filter(i => i !== optionIndex) : [...current, optionIndex].sort((a, b) => a - b);
        data.recordItems[idx] = {
          ...data.recordItems[idx],
          selectedOptionIndices: next,
          checked: next.length > 0,
        };
        saveAll(data);
        refresh();
      }
    },
    [refresh]
  );

  const deleteRecord = useCallback(() => {
    Alert.alert(t('deleteRecordTitle'), t('deleteRecordMessage'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => {
          const data = loadAll();
          data.records = data.records.filter(r => r.id !== recordId);
          data.recordItems = data.recordItems.filter(ri => ri.recordId !== recordId);
          saveAll(data);
          navigation.goBack();
        },
      },
    ]);
  }, [recordId, navigation, t]);

  const toggleFavorite = useCallback(() => {
    const data = loadAll();
    const idx = data.records.findIndex(r => r.id === recordId);
    if (idx >= 0) {
      const current = !!data.records[idx].isFavorite;
      data.records[idx] = { ...data.records[idx], isFavorite: !current };
      saveAll(data);
      setIsFavorite(!current);
    }
  }, [recordId]);

  const shareAsPdf = useCallback(async () => {
    if (!record) return;
    setSharing(true);
    try {
      const html = recordToPdfHtml(record, group, items, t);
      const fileName = `ThinkLess_${record.subjectName.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_${record.date}`;
      const file = await generatePDF({
        html,
        fileName: fileName.slice(0, 80),
        directory: Platform.OS === 'android' ? 'Documents' : undefined,
      });
      if (file.filePath) {
        const fileUrl = file.filePath.startsWith('file://') ? file.filePath : `file://${file.filePath}`;
        await Share.open({
          url: fileUrl,
          type: 'application/pdf',
          title: t('shareRecord'),
        });
      }
    } catch (err) {
      if ((err as { message?: string })?.message?.includes('User did not share')) {
        // 사용자가 공유 취소
      } else {
        Alert.alert(t('backupFailed'), t('backupError'));
      }
    } finally {
      setSharing(false);
    }
  }, [record, group, items, t]);

  const shareAsExcel = useCallback(async () => {
    if (!record) return;
    setSharing(true);
    try {
      const csv = recordToCsv(record, group, items, t);
      const baseName = `ThinkLess_${record.subjectName.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_${record.date}`;
      const csvFileName = `${baseName.slice(0, 80)}.csv`;
      const base64 = utf8ToBase64(csv);
      await Share.open({
        url: `data:text/csv;base64,${base64}`,
        type: 'text/csv',
        title: t('shareRecord'),
        filename: csvFileName,
      });
    } catch (err) {
      if ((err as { message?: string })?.message?.includes('User did not share')) {
        // 사용자가 공유 취소
      } else {
        if (__DEV__ && err instanceof Error) console.warn('Share Excel error:', err.message, err);
        Alert.alert(t('backupFailed'), t('backupError'));
      }
    } finally {
      setSharing(false);
    }
  }, [record, group, items, t]);

  const onSharePress = useCallback(() => {
    Alert.alert(t('shareFormatTitle'), '', [
      { text: t('cancel'), style: 'cancel' },
      { text: t('shareAsPdf'), onPress: shareAsPdf },
      { text: t('shareAsExcel'), onPress: shareAsExcel },
    ]);
  }, [t, shareAsPdf, shareAsExcel]);

  const addCustomItem = useCallback(() => {
    const title = addItemTitle.trim();
    if (!title) return;
    const data = loadAll();
    const recordItems = data.recordItems.filter(ri => ri.recordId === recordId);
    const maxOrder =
      recordItems.length > 0 ? Math.max(...recordItems.map(ri => ri.order ?? 0)) : -1;
    const newItem: RecordItem = {
      id: generateId(),
      recordId,
      customTitle: title,
      order: maxOrder + 1,
      checked: false,
    };
    data.recordItems.push(newItem);
    saveAll(data);
    setAddItemTitle('');
    setAddItemModalVisible(false);
    refresh();
  }, [addItemTitle, recordId, refresh]);

  const openEditModal = useCallback(() => {
    if (!record) return;
    setEditDate(record.date);
    setEditSubjectName(record.subjectName);
    setEditOverallNote(record.overallNote ?? '');
    setEditModalVisible(true);
  }, [record]);

  const onEditDateChange = useCallback((_: unknown, d?: Date) => {
    if (d) {
      setEditDate(d.toISOString().slice(0, 10));
    }
  }, []);

  const saveHeaderEdit = useCallback(() => {
    if (!record || !editDate) return;
    const data = loadAll();
    const idx = data.records.findIndex(r => r.id === recordId);
    if (idx >= 0) {
      data.records[idx] = {
        ...data.records[idx],
        date: editDate,
        subjectName: editSubjectName.trim(),
        overallNote: editOverallNote.trim() || undefined,
      };
      saveAll(data);
      refresh();
    }
    setEditModalVisible(false);
  }, [record, editDate, editSubjectName, editOverallNote, recordId, refresh]);

  const resetChecklist = useCallback(() => {
    Alert.alert(t('resetChecklistTitle'), t('resetChecklistMessage'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('confirm'),
        style: 'destructive',
        onPress: () => {
          const data = loadAll();
          data.recordItems = data.recordItems.map(ri =>
            ri.recordId === recordId
              ? { ...ri, checked: false, selectedOptionIndex: undefined, selectedOptionIndices: undefined }
              : ri
          );
          saveAll(data);
          refresh();
        },
      },
    ]);
  }, [recordId, refresh, t]);

  useLayoutEffect(() => {
    if (record == null) return;
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Pressable onPress={toggleFavorite} hitSlop={8}>
            <FontAwesome
              name={isFavorite ? 'star' : 'star-o'}
              size={20}
              color={isFavorite ? theme.primary : theme.textTertiary}
            />
          </Pressable>
          <Pressable onPress={onSharePress} disabled={sharing} hitSlop={8}>
            {sharing ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Feather name="share-2" size={20} color={theme.primary} />
            )}
          </Pressable>
          <Pressable onPress={deleteRecord} hitSlop={8}>
            <Feather name="trash-2" size={20} color={theme.danger} />
          </Pressable>
        </View>
      ),
    });
  }, [navigation, record, toggleFavorite, isFavorite, theme.primary, theme.textTertiary, onSharePress, sharing, deleteRecord, theme.danger]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
        scroll: { flex: 1 },
        content: { padding: 16, paddingBottom: 32, flexGrow: 1 },
        reportHeader: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          backgroundColor: theme.surface,
          padding: 20,
          borderRadius: 12,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: theme.borderLight,
          borderLeftWidth: 4,
          borderLeftColor: theme.primary,
          ...cardShadow,
        },
        reportHeaderContent: { flex: 1, minWidth: 0 },
        reportHeaderEdit: { padding: 4, marginLeft: 8 },
        reportDate: { fontSize: 13, color: theme.textSecondary, marginBottom: 6 },
        reportTitle: { fontSize: 20, fontWeight: '700', color: theme.text, marginBottom: 4 },
        reportCategory: { fontSize: 14, color: theme.textTertiary, marginBottom: 12 },
        reportNote: {
          fontSize: 14,
          color: theme.textSecondary,
          lineHeight: 22,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: theme.borderLight,
        },
        sectionTitle: { fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 12, marginLeft: 4 },
        row: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          backgroundColor: theme.surface,
          padding: 14,
          borderRadius: 12,
          marginBottom: 8,
          borderWidth: 1,
          borderColor: theme.borderLight,
          ...cardShadow,
        },
        rowPressed: { opacity: 0.9 },
        colNum: { width: 28, marginRight: 8, fontSize: 15, color: theme.textTertiary },
        colStatusIcon: { marginRight: 12, justifyContent: 'center' },
        colContent: { flex: 1 },
        rowTitle: { fontSize: 16, color: theme.text, marginBottom: 2 },
        selectionOptionsList: { marginTop: 10 },
        selectionOptionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
        checklistCheck: { marginRight: 10 },
        optionCheckboxWrap: { marginRight: 8 },
        selectionOptionNum: { fontSize: 14, color: theme.textTertiary, width: 24 },
        selectionOptionRadio: {
          width: 20,
          height: 20,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: theme.borderLight,
          marginRight: 10,
          alignItems: 'center',
          justifyContent: 'center',
        },
        selectionOptionRadioSelected: { borderColor: theme.primary, backgroundColor: theme.primary },
        selectionOptionRadioInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
        selectionOptionLabel: { fontSize: 14, color: theme.text, flex: 1 },
        notFound: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
        notFoundText: { fontSize: 16, color: theme.textSecondary },
        addItemRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          marginTop: 8,
          borderRadius: 12,
          borderWidth: 2,
          borderStyle: 'dashed',
          borderColor: theme.borderLight,
        },
        addItemRowPressed: { opacity: 0.8 },
        addItemRowText: { fontSize: 15, color: theme.primary, fontWeight: '500' },
        modalOverlay: {
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          padding: 24,
        },
        modalBox: {
          backgroundColor: theme.surface,
          borderRadius: 16,
          padding: 20,
        },
        modalTitle: { fontSize: 18, fontWeight: '600', color: theme.text, marginBottom: 16 },
        modalInput: {
          borderWidth: 1,
          borderColor: theme.inputBorder,
          backgroundColor: theme.inputBackground,
          borderRadius: 10,
          padding: 12,
          fontSize: 16,
          color: theme.text,
          marginBottom: 16,
        },
        modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
        modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
        modalBtnCancel: { backgroundColor: theme.buttonSecondary },
        modalBtnCancelText: { color: theme.buttonSecondaryText, fontSize: 16 },
        modalBtnOk: { backgroundColor: theme.primary },
        modalBtnOkText: { color: '#fff', fontSize: 16, fontWeight: '600' },
        resetFab: {
          position: 'absolute',
          right: 20,
          bottom: 20,
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: theme.primary,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 4,
        },
      }),
    [theme, cardShadow]
  );

  if (record == null) {
    return (
      <View style={styles.container}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>{t('recordNotFound')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.reportHeader}>
          <View style={styles.reportHeaderContent}>
            <Text style={styles.reportDate}>{formatDate(record.date)}</Text>
            <Text style={styles.reportTitle}>{record.subjectName}</Text>
            <Text style={styles.reportCategory}>
              {record.groupId ? (group?.name ?? t('noGroup')) : t('custom')}
            </Text>
            {record.overallNote ? (
              <Text style={styles.reportNote}>{record.overallNote}</Text>
            ) : null}
          </View>
          <Pressable
            style={styles.reportHeaderEdit}
            hitSlop={8}
            onPress={openEditModal}
          >
            <Feather name="edit-2" size={18} color={theme.primary} />
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>{t('checkItems')}</Text>
        {items.map(({ index, title, recordItem, template }) => {
          const isSelection = template?.itemType === 'selection' && template.options && template.options.length >= 2;
          const isMultiSelection = template?.itemType === 'selection' && template?.selectionMode === 'multi' && template.options && template.options.length >= 2;
          const selectedIdx = recordItem.selectedOptionIndex;
          const multiIndices = recordItem.selectedOptionIndices ?? [];
          const checked = isMultiSelection
            ? multiIndices.length > 0
            : isSelection
              ? selectedIdx !== undefined
              : recordItem.checked;
          const rowPressable = !isSelection && !isMultiSelection;

          return (
            <Pressable
              key={recordItem.id}
              style={({ pressed }) => [styles.row, rowPressable && pressed && styles.rowPressed]}
              onPress={rowPressable ? () => toggleItemCheck(recordItem) : undefined}
            >
              <Text style={styles.colNum}>{index}.</Text>
              <View style={styles.colStatusIcon}>
                <Checkbox checked={!!checked} size={22} />
              </View>
              <View style={styles.colContent}>
                <Text style={styles.rowTitle}>{title || '(제목 없음)'}</Text>
                {isMultiSelection && template!.options!.length > 0 ? (
                  <View style={styles.selectionOptionsList}>
                    {template!.options!.map((opt, oi) => {
                      const selected = multiIndices.includes(oi);
                      return (
                        <Pressable
                          key={oi}
                          style={styles.selectionOptionRow}
                          onPress={() => toggleItemMultiSelection(recordItem, oi)}
                        >
                          <Text style={styles.selectionOptionNum}>{oi + 1}.</Text>
                          <View style={styles.optionCheckboxWrap}>
                            <Checkbox checked={selected} onPress={() => toggleItemMultiSelection(recordItem, oi)} size={18} />
                          </View>
                          <Text style={styles.selectionOptionLabel}>{opt || `보기 ${oi + 1}`}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : isSelection && template!.options!.length > 0 ? (
                  <View style={styles.selectionOptionsList}>
                    {template!.options!.map((opt, oi) => {
                      const selected = selectedIdx === oi;
                      return (
                        <Pressable
                          key={oi}
                          style={styles.selectionOptionRow}
                          onPress={() => setItemSelection(recordItem, oi)}
                        >
                          <Text style={styles.selectionOptionNum}>{oi + 1}.</Text>
                          <View style={[styles.selectionOptionRadio, selected && styles.selectionOptionRadioSelected]}>
                            {selected ? <View style={styles.selectionOptionRadioInner} /> : null}
                          </View>
                          <Text style={styles.selectionOptionLabel}>{opt || `보기 ${oi + 1}`}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })}
        <Pressable
          style={({ pressed }) => [styles.addItemRow, pressed && styles.addItemRowPressed]}
          onPress={() => setAddItemModalVisible(true)}
        >
          <Feather name="plus" size={18} color={theme.primary} style={{ marginRight: 6 }} />
          <Text style={styles.addItemRowText}>{t('addItem')}</Text>
        </Pressable>
      </ScrollView>
      <Pressable style={styles.resetFab} onPress={resetChecklist} hitSlop={8}>
        <Feather name="rotate-ccw" size={18} color="#fff" />
      </Pressable>

      <Modal
        visible={addItemModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddItemModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setAddItemModalVisible(false)}>
          <Pressable style={styles.modalBox} onPress={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{t('addItem')}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={t('itemTitlePlaceholder')}
              placeholderTextColor={theme.textTertiary}
              value={addItemTitle}
              onChangeText={setAddItemTitle}
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => {
                  setAddItemModalVisible(false);
                  setAddItemTitle('');
                }}
              >
                <Text style={styles.modalBtnCancelText}>{t('cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnOk, !addItemTitle.trim() && { opacity: 0.5 }]}
                disabled={!addItemTitle.trim()}
                onPress={addCustomItem}
              >
                <Text style={styles.modalBtnOkText}>{t('add')}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setEditModalVisible(false)}>
          <Pressable style={styles.modalBox} onPress={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{t('editRecord')}</Text>
            <Text style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 8 }}>
              {t('date')}
            </Text>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              {editDate && (
                <DateTimePicker
                  value={new Date(editDate + 'T12:00:00')}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onEditDateChange}
                  themeVariant={isDark ? 'dark' : 'light'}
                  locale={locale === 'ko' ? 'ko-KR' : 'en-US'}
                />
              )}
            </View>
            <Text style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 6 }}>
              {t('targetName')}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder={t('targetName')}
              placeholderTextColor={theme.textTertiary}
              value={editSubjectName}
              onChangeText={setEditSubjectName}
            />
            <Text style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 6 }}>
              {t('overallNote')}
            </Text>
            <TextInput
              style={[styles.modalInput, { height: 80 }]}
              placeholder={t('overallNoteOptional')}
              placeholderTextColor={theme.textTertiary}
              value={editOverallNote}
              onChangeText={setEditOverallNote}
              multiline
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalBtnCancelText}>{t('cancel')}</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalBtn,
                  styles.modalBtnOk,
                  (!editSubjectName.trim() || !editDate) && { opacity: 0.5 },
                ]}
                disabled={!editSubjectName.trim() || !editDate}
                onPress={saveHeaderEdit}
              >
                <Text style={styles.modalBtnOkText}>{t('save')}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
