import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { generatePDF } from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import type { HomeStackParamList } from '../navigation/types';
import { Checkbox } from '../components';
import { useTheme } from '../theme';
import { loadAll, saveAll } from '../storage';
import { formatDate } from '../utils/date';
import { recordToPdfHtml } from '../utils/recordToPdfHtml';
import type { ChecklistRecord, ChecklistGroup, RecordItem, ChecklistItemTemplate } from '../types';

type Props = NativeStackScreenProps<HomeStackParamList, 'RecordDetail'>;

export function RecordDetailScreen({ route, navigation }: Props) {
  const { recordId } = route.params;
  const { theme } = useTheme();
  const [record, setRecord] = useState<ChecklistRecord | null>(null);
  const [group, setGroup] = useState<ChecklistGroup | null>(null);
  const [items, setItems] = useState<Array<{ index: number; title: string; recordItem: RecordItem; template?: ChecklistItemTemplate | null }>>([]);
  const [sharing, setSharing] = useState(false);

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

  const shareAsPdf = useCallback(async () => {
    if (!record) return;
    setSharing(true);
    try {
      const html = recordToPdfHtml(record, group, items);
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
          title: '기록 공유',
        });
      }
    } catch (err) {
      if ((err as { message?: string })?.message?.includes('User did not share')) {
        // 사용자가 공유 취소
      } else {
        Alert.alert('공유 실패', 'PDF 생성 또는 공유 중 오류가 발생했습니다.');
      }
    } finally {
      setSharing(false);
    }
  }, [record, items]);

  useLayoutEffect(() => {
    if (record == null) return;
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Pressable onPress={shareAsPdf} disabled={sharing} hitSlop={8}>
            {sharing ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Text style={{ color: theme.primary, fontSize: 16 }}>공유</Text>
            )}
          </Pressable>
          <Pressable onPress={() => navigation.navigate('EditRecord', { recordId })} hitSlop={8}>
            <Text style={{ color: theme.primary, fontSize: 16 }}>수정</Text>
          </Pressable>
          <Pressable onPress={deleteRecord} hitSlop={8}>
            <Text style={{ color: theme.danger, fontSize: 16 }}>삭제</Text>
          </Pressable>
        </View>
      ),
    });
  }, [navigation, recordId, record, theme.primary, theme.danger, deleteRecord, shareAsPdf, sharing]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
        scroll: { flex: 1 },
        content: { padding: 16, paddingBottom: 32, flexGrow: 1 },
        reportHeader: {
          backgroundColor: theme.surface,
          padding: 20,
          borderRadius: 12,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: theme.borderLight,
          borderLeftWidth: 4,
          borderLeftColor: theme.primary,
        },
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
        },
        colNum: { width: 28, marginRight: 8, fontSize: 15, color: theme.textTertiary },
        colStatusIcon: { marginRight: 12, justifyContent: 'center' },
        colContent: { flex: 1 },
        rowTitle: { fontSize: 16, color: theme.text, marginBottom: 2 },
        selectionOptionsList: { marginTop: 10 },
        selectionOptionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
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
        <View style={styles.reportHeader}>
          <Text style={styles.reportDate}>{formatDate(record.date)}</Text>
          <Text style={styles.reportTitle}>{record.subjectName}</Text>
          <Text style={styles.reportCategory}>{record.groupId ? (group?.name ?? '(그룹 없음)') : '커스텀'}</Text>
          {record.overallNote ? <Text style={styles.reportNote}>{record.overallNote}</Text> : null}
        </View>

        <Text style={styles.sectionTitle}>체크 항목</Text>
        {items.map(({ index, title, recordItem, template }) => {
          const isSelection = template?.itemType === 'selection' && template.options && template.options.length >= 2;
          const selectedIdx = recordItem.selectedOptionIndex;
          const checked = isSelection ? selectedIdx !== undefined : recordItem.checked;

          return (
            <View key={recordItem.id} style={styles.row}>
              <Text style={styles.colNum}>{index}.</Text>
              <View style={styles.colStatusIcon}>
                <Checkbox checked={!!checked} size={22} />
              </View>
              <View style={styles.colContent}>
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
