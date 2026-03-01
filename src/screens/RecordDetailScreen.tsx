import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import type { HomeStackParamList } from '../navigation/types';
import { useTheme } from '../theme';
import { Checkbox } from '../components';
import { loadAll, saveAll } from '../storage';
import { formatDate } from '../utils/date';
import type { ChecklistRecord, ChecklistGroup, RecordItem, ChecklistItemTemplate } from '../types';

type Props = NativeStackScreenProps<HomeStackParamList, 'RecordDetail'>;

export function RecordDetailScreen({ route, navigation }: Props) {
  const { recordId } = route.params;
  const { theme } = useTheme();
  const [record, setRecord] = useState<ChecklistRecord | null>(null);
  const [group, setGroup] = useState<ChecklistGroup | null>(null);
  const [items, setItems] = useState<Array<{ index: number; title: string; recordItem: RecordItem; template?: ChecklistItemTemplate | null }>>([]);

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
  }, [recordId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const deleteRecord = useCallback(() => {
    Alert.alert('기록 삭제', '이 기록을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
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
  }, [recordId, navigation]);

  useLayoutEffect(() => {
    if (record == null) return;
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Pressable onPress={() => navigation.navigate('EditRecord', { recordId })} hitSlop={8}>
            <Text style={{ color: theme.primary, fontSize: 16 }}>수정</Text>
          </Pressable>
          <Pressable onPress={deleteRecord} hitSlop={8}>
            <Text style={{ color: theme.danger, fontSize: 16 }}>삭제</Text>
          </Pressable>
        </View>
      ),
    });
  }, [navigation, recordId, record, theme.primary, theme.danger, deleteRecord]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
        scroll: { flex: 1 },
        content: { padding: 12, paddingBottom: 24, flexGrow: 1 },
        header: {
          backgroundColor: theme.surface,
          padding: 18,
          borderRadius: 14,
          marginBottom: 14,
          borderWidth: 1,
          borderColor: theme.borderLight,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 2,
        },
        date: { fontSize: 13, color: theme.textSecondary, marginBottom: 4 },
        subject: { fontSize: 18, fontWeight: '600', color: theme.text },
        groupName: { fontSize: 13, color: theme.textTertiary, marginTop: 2 },
        overallNote: {
          fontSize: 14,
          color: theme.textSecondary,
          marginTop: 12,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: theme.borderLight,
        },
        sectionTitle: { fontSize: 15, fontWeight: '600', color: theme.text, marginBottom: 8, marginLeft: 4 },
        rowIndex: { fontSize: 14, color: theme.textTertiary, width: 28, marginRight: 4 },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.surface,
          padding: 14,
          borderRadius: 12,
          marginBottom: 8,
          borderWidth: 1,
          borderColor: theme.borderLight,
        },
        rowCheck: { marginRight: 12 },
        rowContent: { flex: 1 },
        rowTitle: { fontSize: 16, color: theme.text },
        selectionOptionsList: { marginTop: 10 },
        selectionOptionRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 6,
        },
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
      }),
    [theme]
  );

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
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.date}>{formatDate(record.date)}</Text>
          <Text style={styles.subject}>{record.subjectName}</Text>
          <Text style={styles.groupName}>{record.groupId ? (group?.name ?? '(그룹 없음)') : '커스텀'}</Text>
          {record.overallNote ? (
            <Text style={styles.overallNote}>{record.overallNote}</Text>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>체크 항목</Text>
        {items.map(({ index, title, recordItem, template }) => {
          const isSelection = template?.itemType === 'selection' && template.options && template.options.length >= 2;
          const selectedIdx = recordItem.selectedOptionIndex;
          return (
            <View key={recordItem.id} style={styles.row}>
              <Text style={styles.rowIndex}>{index}.</Text>
              <View style={styles.rowCheck}>
                <Checkbox checked={recordItem.checked} disabled />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>{title || '(제목 없음)'}</Text>
                {isSelection && template!.options!.length > 0 ? (
                  <View style={styles.selectionOptionsList}>
                    {template!.options!.map((opt, oi) => {
                      const selected = selectedIdx === oi;
                      return (
                        <View key={oi} style={styles.selectionOptionRow}>
                          <Text style={styles.selectionOptionNum}>{oi + 1}.</Text>
                          <View style={[styles.selectionOptionRadio, selected && styles.selectionOptionRadioSelected]}>
                            {selected ? <View style={styles.selectionOptionRadioInner} /> : null}
                          </View>
                          <Text style={styles.selectionOptionLabel}>{opt || `보기 ${oi + 1}`}</Text>
                        </View>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
