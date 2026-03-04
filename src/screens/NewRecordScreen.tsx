import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
import BottomSheet, { BottomSheetBackdrop, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { HomeStackParamList } from '../navigation/types';
import { Checkbox } from '../components';
import { DEFAULT_SUBJECT_LABEL } from '../constants';
import { useLanguage } from '../i18n';
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

type Nav = NativeStackNavigationProp<HomeStackParamList, 'NewRecord'>;

type Step = 'form' | 'checklist';

type CustomItem = { tempId: string; title: string; checked: boolean };

function todayYmd(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function NewRecordScreen() {
  const { theme, isDark } = useTheme();
  const { t, locale } = useLanguage();
  const navigation = useNavigation<Nav>();
  const [step, setStep] = useState<Step>('form');
  const [date, setDate] = useState<string>(todayYmd());
  const [showDateModal, setShowDateModal] = useState(false);
  const [subjectName, setSubjectName] = useState('');
  const [groupId, setGroupId] = useState<string | null>(null);
  const groupSheetRef = useRef<BottomSheet>(null);
  const [overallNote, setOverallNote] = useState('');
  const [itemChecks, setItemChecks] = useState<Record<string, boolean>>({});
  const [itemSelections, setItemSelections] = useState<Record<string, number>>({});
  const [customItems, setCustomItems] = useState<CustomItem[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);

  const data = loadAll();
  const groups = data.groups;
  const selectedGroup = groups.find(g => g.id === groupId) ?? null;
  const templates = useMemo(
    () =>
      selectedGroup
        ? data.templates.filter(t => t.groupId === selectedGroup.id).sort((a, b) => a.order - b.order)
        : [],
    [selectedGroup, data.templates]
  );

  const subjectLabel = selectedGroup?.subjectLabel?.trim() || DEFAULT_SUBJECT_LABEL;

  const canGoNext =
    step === 'form' &&
    date.length > 0 &&
    subjectName.trim().length > 0;

  useLayoutEffect(() => {
    if (step === 'checklist') {
      navigation.setOptions({
        headerLeft: () => (
          <Pressable onPress={() => setStep('form')} style={{ paddingVertical: 8, paddingRight: 16 }}>
            <Text style={{ fontSize: 16, color: theme.primary }}>{t('back')}</Text>
          </Pressable>
        ),
      });
    } else {
      navigation.setOptions({ headerLeft: undefined });
    }
  }, [step, navigation, theme.primary]);

  const goToChecklist = useCallback(() => {
    if (!canGoNext) return;
    const initial: Record<string, boolean> = {};
    templates.forEach(t => {
      initial[t.id] = false;
    });
    setItemChecks(initial);
    setItemSelections({});
    setCustomItems([]);
    setStep('checklist');
  }, [canGoNext, templates]);

  const toggleCheck = useCallback((templateId: string) => {
    setItemChecks(prev => ({ ...prev, [templateId]: !prev[templateId] }));
  }, []);

  const setSelection = useCallback((templateId: string, optionIndex: number) => {
    setItemSelections(prev => ({ ...prev, [templateId]: optionIndex }));
  }, []);

  const addCustomItem = useCallback(() => {
    setCustomItems(prev => [
      ...prev,
      { tempId: generateId(), title: '', checked: false },
    ]);
  }, []);

  const updateCustomItem = useCallback((tempId: string, patch: Partial<CustomItem>) => {
    setCustomItems(prev => prev.map(c => (c.tempId === tempId ? { ...c, ...patch } : c)));
  }, []);

  const removeCustomItem = useCallback((tempId: string) => {
    setCustomItems(prev => prev.filter(c => c.tempId !== tempId));
  }, []);

  const saveRecord = useCallback(() => {
    const recordId = generateId();
    const now = new Date().toISOString();
    const record: ChecklistRecord = {
      id: recordId,
      date,
      subjectName: subjectName.trim(),
      ...(groupId ? { groupId } : {}),
      createdAt: now,
      overallNote: overallNote.trim() || undefined,
      isFavorite,
    };
    const recordItems: RecordItem[] = [];
    let order = 0;
    templates.forEach(t => {
      const isSelection = t.itemType === 'selection' && t.options && t.options.length >= 2;
      const selectedIdx = itemSelections[t.id];
      recordItems.push({
        id: generateId(),
        recordId,
        templateItemId: t.id,
        customTitle: t.title,
        order: order++,
        checked: isSelection ? selectedIdx !== undefined : (itemChecks[t.id] ?? false),
        ...(isSelection && selectedIdx !== undefined ? { selectedOptionIndex: selectedIdx } : {}),
      });
    });
    customItems.forEach(c => {
      if (c.title.trim()) {
        recordItems.push({
          id: generateId(),
          recordId,
          customTitle: c.title.trim(),
          order: order++,
          checked: c.checked,
        });
      }
    });
    const next = loadAll();
    next.records.push(record);
    next.recordItems.push(...recordItems);
    saveAll(next);
    setStep('form');
    setSubjectName('');
    setGroupId(null);
    setOverallNote('');
    setItemChecks({});
    setItemSelections({});
    setCustomItems([]);
    setDate(todayYmd());
    setIsFavorite(false);
    const parent = navigation.getParent();
    if (parent) {
      (parent as { navigate: (name: string) => void }).navigate('HomeTab');
    }
  }, [groupId, date, subjectName, overallNote, templates, itemChecks, itemSelections, customItems, navigation]);

  const onDateChange = useCallback((_: unknown, d?: Date) => {
    if (d) setDate(d.toISOString().slice(0, 10));
    if (Platform.OS === 'android') setShowDateModal(false);
  }, []);

  const groupOptions = useMemo(
    () => [{ id: null as string | null, name: t('customWrite') }, ...groups.map(g => ({ id: g.id, name: g.name }))],
    [groups, t]
  );

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
        rowWithArrow: { flexDirection: 'row', alignItems: 'center' },
        rowPressed: { opacity: 0.9 },
        rowLabel: { fontSize: 13, color: theme.textSecondary, marginBottom: 4 },
        rowValue: { fontSize: 16, color: theme.text, fontWeight: '500' },
        input: {
          borderWidth: 1,
          borderColor: theme.inputBorder,
          backgroundColor: theme.inputBackground,
          borderRadius: 10,
          padding: 12,
          fontSize: 16,
          color: theme.text,
        },
        comboTrigger: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: theme.inputBackground,
          padding: 14,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: theme.inputBorder,
        },
        comboTriggerText: { fontSize: 16, color: theme.text },
        comboTriggerPlaceholder: { fontSize: 16, color: theme.placeholder },
        comboArrow: { fontSize: 14, color: theme.textSecondary },
        comboDropdown: {
          marginTop: 4,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: theme.borderLight,
          backgroundColor: theme.surface,
          overflow: 'hidden',
        },
        comboOption: {
          flexDirection: 'row',
          alignItems: 'center',
          padding: 14,
          borderBottomWidth: 1,
          borderBottomColor: theme.borderLight,
        },
        comboOptionLast: { borderBottomWidth: 0 },
        comboOptionSelected: { backgroundColor: theme.surfaceVariant },
        comboOptionText: { fontSize: 16, color: theme.text, flex: 1 },
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
        overallNoteLabel: { fontSize: 14, color: theme.textSecondary, marginBottom: 6 },
        emptyGroups: { padding: 16, alignItems: 'center' },
        emptyGroupsText: { fontSize: 14, color: theme.textSecondary },
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
        dateModalTitle: {
          fontSize: 17,
          fontWeight: '600',
          color: theme.text,
        },
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

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} opacity={0.5} />
    ),
    []
  );

  const renderGroupOption = useCallback(
    ({
      item,
      index,
    }: {
      item: { id: string | null; name: string };
      index: number;
    }) => (
      <Pressable
        style={[
          styles.comboOption,
          index === groupOptions.length - 1 && styles.comboOptionLast,
          item.id === groupId && styles.comboOptionSelected,
        ]}
        onPress={() => {
          setGroupId(item.id);
          groupSheetRef.current?.close();
        }}
      >
        <Text style={styles.comboOptionText}>{item.name}</Text>
      </Pressable>
    ),
    [groupId, groupOptions.length, styles]
  );

  if (step === 'form') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionTitle}>{t('date')}</Text>
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
            <Pressable
              style={styles.dateModalOverlay}
              onPress={() => setShowDateModal(false)}
            >
              <Pressable style={styles.dateModalContent} onPress={e => e.stopPropagation()}>
                <View style={styles.dateModalHeader}>
                  <Text style={styles.dateModalTitle}>{t('selectDate')}</Text>
                  <View style={styles.dateModalActions}>
                    <Pressable
                      onPress={() => setShowDateModal(false)}
                      style={styles.dateModalCancelBtn}
                    >
                      <Text style={styles.dateModalCancelText}>{t('cancel')}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setShowDateModal(false)}
                      style={styles.dateModalConfirmBtn}
                    >
                      <Text style={styles.dateModalConfirmText}>{t('confirm')}</Text>
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
                    locale={locale === 'ko' ? 'ko-KR' : 'en-US'}
                  />
                </View>
              </Pressable>
            </Pressable>
          </Modal>

          <Text style={styles.sectionTitle}>{subjectLabel === DEFAULT_SUBJECT_LABEL ? t('targetName') : subjectLabel}</Text>
          <TextInput
            style={[styles.input, { marginBottom: 8 }]}
            placeholder={`${subjectLabel === DEFAULT_SUBJECT_LABEL ? t('targetName') : subjectLabel} ${t('subjectInputPlaceholder')}`}
            placeholderTextColor={theme.placeholder}
            value={subjectName}
            onChangeText={setSubjectName}
          />

          <Text style={styles.sectionTitle}>{t('checklistType')}</Text>
          <View style={{ marginBottom: 8 }}>
            <Pressable
              style={styles.comboTrigger}
              onPress={() => groupSheetRef.current?.expand()}
            >
              <Text style={styles.comboTriggerText}>
                {groupId === null ? t('customWrite') : (selectedGroup?.name ?? t('select'))}
              </Text>
              <Text style={styles.comboArrow}>{'>'}</Text>
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 12 }}>
            <Checkbox checked={isFavorite} onPress={() => setIsFavorite(prev => !prev)} size={22} />
            <Text style={{ marginLeft: 10, fontSize: 15, color: theme.text }}>{t('favorite')}</Text>
          </View>

          <Pressable
            style={[styles.btn, styles.btnPrimary, !canGoNext && { opacity: 0.5 }]}
            onPress={goToChecklist}
            disabled={!canGoNext}
          >
            <Text style={styles.btnPrimaryText}>{t('startRecord')}</Text>
          </Pressable>
        </ScrollView>
        <BottomSheet
          ref={groupSheetRef}
          index={-1}
          snapPoints={['40%', '70%']}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={{
            backgroundColor: theme.surface,
            borderTopWidth: 2,
            borderTopColor: theme.borderLight,
          }}
          handleIndicatorStyle={{ backgroundColor: theme.textTertiary }}
        >
          <BottomSheetFlatList
            data={groupOptions}
            keyExtractor={(item: { id: string | null; name: string }) => item.id ?? 'direct'}
            renderItem={renderGroupOption}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        </BottomSheet>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{subjectLabel === DEFAULT_SUBJECT_LABEL ? t('targetName') : subjectLabel}</Text>
          <Text style={styles.rowValue}>{subjectName}</Text>
          <Text style={[styles.rowLabel, { marginTop: 4 }]}>{formatDate(date)} · {selectedGroup?.name ?? t('customWrite')}</Text>
        </View>

        <Text style={styles.sectionTitle}>{t('overallNote')}</Text>
        <TextInput
          style={[styles.input, { marginBottom: 8, minHeight: 60 }]}
          placeholder={t('overallNoteOptional')}
          placeholderTextColor={theme.placeholder}
          value={overallNote}
          onChangeText={setOverallNote}
          multiline
        />

        <Text style={styles.sectionTitle}>{t('checkItems')}</Text>
        {templates.map((template, idx) => {
          const isSelection = template.itemType === 'selection' && template.options && template.options.length >= 2;
          return (
            <View key={template.id} style={styles.checklistItem}>
              <Text style={styles.itemIndex}>{idx + 1}.</Text>
              {isSelection ? (
                <View style={styles.checklistBody}>
                  <Text style={styles.checklistTitle}>{template.title}</Text>
                  <View style={styles.selectionOptionsList}>
                    {template.options!.map((opt, oi) => {
                      const selected = itemSelections[template.id] === oi;
                      return (
                        <Pressable
                          key={oi}
                          style={styles.selectionOptionRow}
                          onPress={() => setSelection(template.id, oi)}
                        >
                          <Text style={styles.selectionOptionNum}>{oi + 1}.</Text>
                          <View style={[styles.selectionOptionRadio, selected && styles.selectionOptionRadioSelected]}>
                            {selected ? <View style={styles.selectionOptionRadioInner} /> : null}
                          </View>
                          <Text style={styles.selectionOptionLabel}>{opt || t('optionLabel', { num: oi + 1 })}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.checklistCheck}>
                    <Checkbox
                      checked={!!itemChecks[template.id]}
                      onPress={() => toggleCheck(template.id)}
                      size={26}
                    />
                  </View>
                  <View style={styles.checklistBody}>
                    <Text style={styles.checklistTitle}>{template.title}</Text>
                  </View>
                </>
              )}
            </View>
          );
        })}
        {customItems.map((c, idx) => (
          <View key={c.tempId} style={styles.checklistItem}>
            <Text style={styles.itemIndex}>{templates.length + idx + 1}.</Text>
            <View style={styles.checklistCheck}>
              <Checkbox
                checked={c.checked}
                onPress={() => updateCustomItem(c.tempId, { checked: !c.checked })}
                size={26}
              />
            </View>
            <View style={styles.checklistBody}>
              <TextInput
                style={styles.checklistTitle}
                placeholder={t('itemTitlePlaceholder')}
                placeholderTextColor={theme.placeholder}
                value={c.title}
                onChangeText={v => updateCustomItem(c.tempId, { title: v })}
              />
            </View>
            <Pressable style={styles.customItemDelete} onPress={() => removeCustomItem(c.tempId)}>
              <Text style={styles.customItemDeleteText}>{t('delete')}</Text>
            </Pressable>
          </View>
        ))}
        <Pressable style={styles.addItemBtn} onPress={addCustomItem}>
          <Text style={styles.addItemBtnText}>{t('addItem')}</Text>
        </Pressable>

        <Pressable style={[styles.btn, styles.btnPrimary]} onPress={saveRecord}>
          <Text style={styles.btnPrimaryText}>{t('save')}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
