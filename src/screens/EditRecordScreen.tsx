import React, { useCallback, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
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
import type { HomeStackParamList } from '../navigation/types';
import { Checkbox } from '../components';
import { DEFAULT_SUBJECT_LABEL } from '../constants';
import { useTheme } from '../theme';
import { loadAll, saveAll } from '../storage';
import { generateId } from '../utils/id';
import { formatDate } from '../utils/date';
import type {
  ChecklistGroup,
  ChecklistItemTemplate,
  ChecklistRecord,
  RecordItem,
} from '../types';

type Props = NativeStackScreenProps<HomeStackParamList, 'EditRecord'>;

type CustomItemEdit = { id: string; title: string; checked: boolean };

export function EditRecordScreen({ route, navigation }: Props) {
  const { recordId } = route.params;
  const { theme, isDark } = useTheme();
  const [record, setRecord] = useState<ChecklistRecord | null>(null);
  const [group, setGroup] = useState<ChecklistGroup | null>(null);
  const [templates, setTemplates] = useState<ChecklistItemTemplate[]>([]);
  const [date, setDate] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [showDateModal, setShowDateModal] = useState(false);
  const [overallNote, setOverallNote] = useState('');
  const [itemChecks, setItemChecks] = useState<Record<string, boolean>>({});
  const [itemSelections, setItemSelections] = useState<Record<string, number>>({});
  const [customItems, setCustomItems] = useState<CustomItemEdit[]>([]);
  const [loaded, setLoaded] = useState(false);

  const loadRecord = useCallback(() => {
    const data = loadAll();
    const r = data.records.find(rec => rec.id === recordId) ?? null;
    setRecord(r);
    if (!r) {
      setGroup(null);
      setTemplates([]);
      return;
    }
    const g = r.groupId ? data.groups.find(gr => gr.id === r.groupId) ?? null : null;
    setGroup(g);
    const tpls = r.groupId
      ? data.templates.filter(t => t.groupId === r.groupId).sort((a, b) => a.order - b.order)
      : [];
    setTemplates(tpls);
    setDate(r.date);
    setSubjectName(r.subjectName);
    setOverallNote(r.overallNote ?? '');
    const recordItems = data.recordItems
      .filter(ri => ri.recordId === recordId)
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    const checks: Record<string, boolean> = {};
    const selections: Record<string, number> = {};
    tpls.forEach(t => {
      const ri = recordItems.find(x => x.templateItemId === t.id);
      checks[t.id] = ri?.checked ?? false;
      if (ri?.selectedOptionIndex !== undefined) selections[t.id] = ri.selectedOptionIndex;
    });
    const custom = recordItems
      .filter(ri => ri.customTitle != null)
      .map(ri => ({
        id: ri.id,
        title: ri.customTitle ?? '',
        checked: ri.checked,
      }));
    setItemChecks(checks);
    setItemSelections(selections);
    setCustomItems(custom);
    setLoaded(true);
  }, [recordId]);

  useFocusEffect(
    useCallback(() => {
      loadRecord();
    }, [loadRecord])
  );

  const subjectLabel = group?.subjectLabel?.trim() || DEFAULT_SUBJECT_LABEL;

  const toggleCheck = useCallback((templateId: string) => {
    setItemChecks(prev => ({ ...prev, [templateId]: !prev[templateId] }));
  }, []);

  const setSelection = useCallback((templateId: string, optionIndex: number) => {
    setItemSelections(prev => ({ ...prev, [templateId]: optionIndex }));
  }, []);

  const addCustomItem = useCallback(() => {
    setCustomItems(prev => [
      ...prev,
      { id: generateId(), title: '', checked: false },
    ]);
  }, []);

  const updateCustomItem = useCallback((id: string, patch: Partial<CustomItemEdit>) => {
    setCustomItems(prev => prev.map(c => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const removeCustomItem = useCallback((id: string) => {
    setCustomItems(prev => prev.filter(c => c.id !== id));
  }, []);

  const saveRecord = useCallback(() => {
    if (!record) return;
    const updated: ChecklistRecord = {
      ...record,
      date,
      subjectName: subjectName.trim(),
      overallNote: overallNote.trim() || undefined,
    };
    const next = loadAll();
    const recIdx = next.records.findIndex(r => r.id === recordId);
    if (recIdx >= 0) next.records[recIdx] = updated;
    next.recordItems = next.recordItems.filter(ri => ri.recordId !== recordId);
    const newItems: RecordItem[] = [];
    let order = 0;
    templates.forEach(t => {
      const isSelection = t.itemType === 'selection' && t.options && t.options.length >= 2;
      const selectedIdx = itemSelections[t.id];
      newItems.push({
        id: generateId(),
        recordId,
        templateItemId: t.id,
        order: order++,
        checked: isSelection ? selectedIdx !== undefined : (itemChecks[t.id] ?? false),
        ...(isSelection && selectedIdx !== undefined ? { selectedOptionIndex: selectedIdx } : {}),
      });
    });
    customItems.forEach(c => {
      if (c.title.trim()) {
        newItems.push({
          id: c.id,
          recordId,
          customTitle: c.title.trim(),
          order: order++,
          checked: c.checked,
        });
      }
    });
    next.recordItems.push(...newItems);
    saveAll(next);
    navigation.goBack();
  }, [record, recordId, date, subjectName, overallNote, templates, itemChecks, itemSelections, customItems, navigation]);

  const onDateChange = useCallback((_: unknown, d?: Date) => {
    if (d) setDate(d.toISOString().slice(0, 10));
    if (Platform.OS === 'android') setShowDateModal(false);
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
        scroll: { flex: 1 },
        content: { padding: 16, paddingBottom: 32 },
        sectionTitle: {
          fontSize: 15,
          fontWeight: '600',
          color: theme.text,
          marginBottom: 8,
          marginTop: 8,
        },
        row: {
          backgroundColor: theme.surface,
          padding: 14,
          borderRadius: 12,
          marginBottom: 8,
          borderWidth: 1,
          borderColor: theme.borderLight,
        },
        rowPressed: { opacity: 0.9 },
        rowLabel: { fontSize: 13, color: theme.textSecondary, marginBottom: 4 },
        rowValue: { fontSize: 16, color: theme.text, fontWeight: '500' },
        rowMuted: { fontSize: 14, color: theme.textTertiary, marginTop: 4 },
        input: {
          borderWidth: 1,
          borderColor: theme.inputBorder,
          backgroundColor: theme.inputBackground,
          borderRadius: 10,
          padding: 12,
          fontSize: 16,
          color: theme.text,
        },
        btn: {
          paddingVertical: 14,
          borderRadius: 12,
          alignItems: 'center',
          marginTop: 16,
        },
        btnPrimary: { backgroundColor: theme.primary },
        btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
        btnSecondary: { backgroundColor: theme.buttonSecondary },
        btnSecondaryText: { color: theme.buttonSecondaryText, fontSize: 16 },
        checklistItem: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.surface,
          padding: 14,
          borderRadius: 12,
          marginBottom: 8,
          borderWidth: 1,
          borderColor: theme.borderLight,
        },
        checklistCheck: { marginRight: 12 },
        checklistBody: { flex: 1 },
        checklistTitle: { fontSize: 16, color: theme.text },
        selectionOptionsList: { marginTop: 10 },
        selectionOptionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
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
        itemIndex: { fontSize: 14, color: theme.textTertiary, width: 28, marginRight: 4 },
        addItemBtn: {
          paddingVertical: 12,
          borderRadius: 12,
          borderWidth: 2,
          borderStyle: 'dashed',
          borderColor: theme.borderLight,
          alignItems: 'center',
          marginTop: 8,
        },
        addItemBtnText: { fontSize: 14, color: theme.textSecondary },
        customItemDelete: { paddingVertical: 6, paddingHorizontal: 10 },
        customItemDeleteText: { fontSize: 13, color: theme.danger },
        overallNoteLabel: { fontSize: 14, color: theme.textSecondary, marginBottom: 6 },
        notFound: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
        notFoundText: { fontSize: 16, color: theme.textSecondary },
        rowWithArrow: { flexDirection: 'row', alignItems: 'center' },
        comboArrow: { fontSize: 14, color: theme.textSecondary },
        dateModalOverlay: {
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        },
        dateModalContent: {
          backgroundColor: theme.surface,
          borderRadius: 16,
          width: '100%',
          maxWidth: 340,
          overflow: 'hidden',
        },
        dateModalHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 14,
        },
        dateModalTitle: { fontSize: 17, fontWeight: '600', color: theme.text },
        dateModalActions: { flexDirection: 'row', alignItems: 'center' },
        dateModalCancelBtn: { paddingVertical: 6, paddingHorizontal: 4 },
        dateModalCancelText: { fontSize: 16, color: theme.textSecondary },
        dateModalConfirmBtn: { paddingVertical: 6, paddingHorizontal: 4, marginLeft: 16 },
        dateModalConfirmText: { fontSize: 16, fontWeight: '600', color: theme.primary },
        dateModalDivider: {
          height: 1,
          backgroundColor: theme.borderLight,
          marginHorizontal: 20,
        },
        datePickerWrap: { paddingVertical: 8, alignItems: 'center' },
      }),
    [theme]
  );

  if (!loaded) {
    return <View style={styles.container} />;
  }
  if (record == null) {
    return (
      <View style={styles.container}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>기록을 찾을 수 없어요.</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>날짜</Text>
        <Pressable
          style={({ pressed }) => [styles.row, styles.rowWithArrow, pressed && styles.rowPressed]}
          onPress={() => setShowDateModal(true)}
        >
          <Text style={[styles.rowValue, { flex: 1 }]}>{formatDate(date)}</Text>
          <Text style={styles.comboArrow}>{'>'}</Text>
        </Pressable>
        <Modal
          visible={showDateModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDateModal(false)}
        >
          <Pressable style={styles.dateModalOverlay} onPress={() => setShowDateModal(false)}>
            <Pressable style={styles.dateModalContent} onPress={e => e.stopPropagation()}>
              <View style={styles.dateModalHeader}>
                <Text style={styles.dateModalTitle}>날짜 선택</Text>
                <View style={styles.dateModalActions}>
                  <Pressable onPress={() => setShowDateModal(false)} style={styles.dateModalCancelBtn}>
                    <Text style={styles.dateModalCancelText}>취소</Text>
                  </Pressable>
                  <Pressable onPress={() => setShowDateModal(false)} style={styles.dateModalConfirmBtn}>
                    <Text style={styles.dateModalConfirmText}>확인</Text>
                  </Pressable>
                </View>
              </View>
              <View style={styles.dateModalDivider} />
              <View style={styles.datePickerWrap}>
                <DateTimePicker
                  value={new Date(date + 'T12:00:00')}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                  themeVariant={isDark ? 'dark' : 'light'}
                />
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        <Text style={styles.sectionTitle}>대상 이름</Text>
        <TextInput
          style={[styles.input, { marginBottom: 8 }]}
          placeholder={`${subjectLabel} 입력`}
          placeholderTextColor={theme.placeholder}
          value={subjectName}
          onChangeText={setSubjectName}
        />

        <Text style={styles.sectionTitle}>체크리스트 그룹</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>선택된 그룹 (수정 불가)</Text>
          <Text style={styles.rowValue}>{record.groupId ? (group?.name ?? '(없음)') : '커스텀'}</Text>
        </View>

        <Text style={styles.sectionTitle}>전체 비고</Text>
        <TextInput
          style={[styles.input, { marginBottom: 8, minHeight: 60 }]}
          placeholder="전체 비고 (선택)"
          placeholderTextColor={theme.placeholder}
          value={overallNote}
          onChangeText={setOverallNote}
          multiline
        />

        <Text style={styles.sectionTitle}>체크 항목</Text>
        {templates.map((t, idx) => {
          const isSelection = t.itemType === 'selection' && t.options && t.options.length >= 2;
          return (
            <View key={t.id} style={styles.checklistItem}>
              <Text style={styles.itemIndex}>{idx + 1}.</Text>
              {isSelection ? (
                <View style={styles.checklistBody}>
                  <Text style={styles.checklistTitle}>{t.title}</Text>
                  <View style={styles.selectionOptionsList}>
                    {t.options!.map((opt, oi) => {
                      const selected = itemSelections[t.id] === oi;
                      return (
                        <Pressable
                          key={oi}
                          style={styles.selectionOptionRow}
                          onPress={() => setSelection(t.id, oi)}
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
                </View>
              ) : (
                <>
                  <View style={styles.checklistCheck}>
                    <Checkbox
                      checked={!!itemChecks[t.id]}
                      onPress={() => toggleCheck(t.id)}
                      size={26}
                    />
                  </View>
                  <View style={styles.checklistBody}>
                    <Text style={styles.checklistTitle}>{t.title}</Text>
                  </View>
                </>
              )}
            </View>
          );
        })}
        {customItems.map((c, idx) => (
          <View key={c.id} style={styles.checklistItem}>
            <Text style={styles.itemIndex}>{templates.length + idx + 1}.</Text>
            <View style={styles.checklistCheck}>
              <Checkbox
                checked={c.checked}
                onPress={() => updateCustomItem(c.id, { checked: !c.checked })}
                size={26}
              />
            </View>
            <View style={styles.checklistBody}>
              <TextInput
                style={styles.checklistTitle}
                placeholder="항목 제목"
                placeholderTextColor={theme.placeholder}
                value={c.title}
                onChangeText={v => updateCustomItem(c.id, { title: v })}
              />
            </View>
            <Pressable style={styles.customItemDelete} onPress={() => removeCustomItem(c.id)}>
              <Text style={styles.customItemDeleteText}>삭제</Text>
            </Pressable>
          </View>
        ))}
        <Pressable style={styles.addItemBtn} onPress={addCustomItem}>
          <Text style={styles.addItemBtnText}>+ 항목 추가</Text>
        </Pressable>

        <Pressable style={[styles.btn, styles.btnPrimary]} onPress={saveRecord}>
          <Text style={styles.btnPrimaryText}>저장하기</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
