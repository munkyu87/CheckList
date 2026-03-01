import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import BottomSheet, { BottomSheetBackdrop, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { HomeStackParamList } from '../navigation/types';
import { Checkbox } from '../components';
import { useTheme } from '../theme';
import { loadAll } from '../storage';
import {
  formatDate,
  getTodayYmd,
  getThisMonthRange,
  getThisWeekRange,
} from '../utils/date';
import type { ChecklistGroup, ChecklistRecord } from '../types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Home'>;

type RecordWithCompleted = { record: ChecklistRecord; isCompleted: boolean };

type DateFilterKind = 'all' | 'today' | 'thisWeek' | 'thisMonth' | 'custom';

const TAB_BAR_HEIGHT = 56;

export function HomeScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const listPaddingBottom = insets.bottom + TAB_BAR_HEIGHT + 24;
  const [recordsWithStatus, setRecordsWithStatus] = useState<RecordWithCompleted[]>([]);
  const [groups, setGroups] = useState<ChecklistGroup[]>([]);
  const [groupNames, setGroupNames] = useState<Record<string, string>>({});
  const [dateFilterKind, setDateFilterKind] = useState<DateFilterKind>('all');
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [filterGroupId, setFilterGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hideCompleted, setHideCompleted] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [filterExpanded, setFilterExpanded] = useState(false);
  const groupSheetRef = useRef<BottomSheet>(null);
  const dateSheetRef = useRef<BottomSheet>(null);

  const refresh = useCallback(() => {
    const data = loadAll();
    setGroups(data.groups);
    const names: Record<string, string> = {};
    data.groups.forEach(g => {
      names[g.id] = g.name;
    });
    setGroupNames(names);

    const withStatus: RecordWithCompleted[] = data.records.map(record => {
      const recordItems = data.recordItems.filter(ri => ri.recordId === record.id);
      const isCompleted =
        recordItems.length > 0 && recordItems.every(ri => ri.checked === true);
      return { record, isCompleted };
    });

    withStatus.sort(
      (a, b) => new Date(b.record.date).getTime() - new Date(a.record.date).getTime()
    );
    setRecordsWithStatus(withStatus);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return recordsWithStatus.filter(({ record, isCompleted }) => {
      if (dateFilterKind !== 'all') {
        if (dateFilterKind === 'today') {
          if (record.date !== getTodayYmd()) return false;
        } else if (dateFilterKind === 'thisWeek') {
          const { start, end } = getThisWeekRange();
          if (record.date < start || record.date > end) return false;
        } else if (dateFilterKind === 'thisMonth') {
          const { start, end } = getThisMonthRange();
          if (record.date < start || record.date > end) return false;
        } else if (dateFilterKind === 'custom' && filterDate != null) {
          if (record.date !== filterDate) return false;
        }
      }
      if (filterGroupId != null && (record.groupId ?? '') !== filterGroupId) return false;
      if (q.length > 0 && !record.subjectName.toLowerCase().includes(q)) return false;
      if (hideCompleted && isCompleted) return false;
      return true;
    });
  }, [recordsWithStatus, dateFilterKind, filterDate, filterGroupId, searchQuery, hideCompleted]);

  const onDateChange = useCallback((_: unknown, d?: Date) => {
    if (d) {
      setFilterDate(d.toISOString().slice(0, 10));
      setDateFilterKind('custom');
    }
    if (Platform.OS === 'android') setShowDateModal(false);
  }, []);

  const dateFilterLabel =
    dateFilterKind === 'all'
      ? '전체'
      : dateFilterKind === 'today'
        ? '오늘'
        : dateFilterKind === 'thisWeek'
          ? '이번 주'
          : dateFilterKind === 'thisMonth'
            ? '이번 달'
            : filterDate
              ? formatDate(filterDate)
              : '직접 선택';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
        filterSection: {
          backgroundColor: theme.surfaceVariant,
          padding: 10,
          paddingTop: 14,
          marginHorizontal: 12,
          marginVertical: 10,
          borderRadius: 12,
          overflow: 'hidden',
        },
        filterSectionTopBar: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          backgroundColor: theme.primary,
          opacity: 0.28,
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
        },
        filterHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 4,
        },
        filterTitle: { fontSize: 14, fontWeight: '600', color: theme.text },
        filterSummary: { fontSize: 12, color: theme.textSecondary, marginLeft: 8 },
        filterBody: { marginTop: 4 },
        searchWrap: {
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: theme.inputBorder,
          backgroundColor: theme.inputBackground,
          borderRadius: 8,
          marginBottom: 10,
          paddingLeft: 12,
        },
        searchIcon: { fontSize: 16, marginRight: 8, opacity: 0.7 },
        searchInput: {
          flex: 1,
          paddingVertical: 10,
          paddingRight: 10,
          fontSize: 14,
          color: theme.text,
        },
        filterComboWrap: { marginBottom: 10 },
        filterComboTrigger: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 10,
          paddingHorizontal: 14,
          backgroundColor: theme.inputBackground,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: theme.inputBorder,
        },
        filterComboTriggerText: { fontSize: 15, color: theme.text },
        filterComboChevron: { fontSize: 12, color: theme.textSecondary },
        filterComboDropdown: {
          marginTop: 4,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: theme.borderLight,
          backgroundColor: theme.surface,
          overflow: 'hidden',
        },
        filterComboOption: {
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderBottomWidth: 1,
          borderBottomColor: theme.borderLight,
        },
        filterComboOptionLast: { borderBottomWidth: 0 },
        filterComboOptionText: { fontSize: 15, color: theme.text },
        filterDateCompleteRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 4,
        },
        filterDateTrigger: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 10,
          paddingHorizontal: 14,
          backgroundColor: theme.inputBackground,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: theme.inputBorder,
          flex: 1,
          marginRight: 12,
          maxWidth: '55%',
        },
        sheetContent: { paddingBottom: 24 },
        sheetOption: {
          paddingVertical: 16,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: theme.borderLight,
        },
        sheetOptionLast: { borderBottomWidth: 0 },
        sheetOptionSelected: { backgroundColor: theme.surfaceVariant },
        sheetOptionText: { fontSize: 16, color: theme.text },
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
        checkboxRow: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        checkboxText: { fontSize: 14, color: theme.text, marginLeft: 10 },
        listWrap: { flex: 1 },
        list: { padding: 12, flexGrow: 1 },
        empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
        emptyText: { fontSize: 16, color: theme.text, marginBottom: 8 },
        emptyHint: { fontSize: 14, color: theme.textSecondary },
        item: {
          flexDirection: 'row',
          backgroundColor: theme.surface,
          borderRadius: 12,
          marginBottom: 5,
          borderWidth: 0,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0.08 : 0.04,
          shadowRadius: isDark ? 6 : 3,
          elevation: isDark ? 3 : 2,
        },
        itemPressed: { opacity: 0.85 },
        itemBar: {
          width: 4,
          backgroundColor: theme.primary,
          opacity: 0.8,
        },
        itemBody: { flex: 1, padding: 14, paddingLeft: 12 },
        itemRow1: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
        itemSubject: { fontSize: 17, fontWeight: '600', color: theme.text, flex: 1, marginRight: 8 },
        itemDate: { fontSize: 13, color: theme.textSecondary },
        itemRow2: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
        itemGroup: { fontSize: 13, color: theme.textTertiary, flex: 1 },
        itemCheck: { fontSize: 18, color: theme.primary, fontWeight: '600' },
      }),
    [theme, isDark]
  );

  const groupOptions = useMemo(
    () => [{ id: null as string | null, name: '전체' }, ...groups.map(g => ({ id: g.id, name: g.name }))],
    [groups]
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
          styles.sheetOption,
          index === groupOptions.length - 1 && styles.sheetOptionLast,
          item.id === filterGroupId && styles.sheetOptionSelected,
        ]}
        onPress={() => {
          setFilterGroupId(item.id);
          groupSheetRef.current?.close();
        }}
      >
        <Text style={styles.sheetOptionText}>{item.name}</Text>
      </Pressable>
    ),
    [styles, groupOptions.length, filterGroupId]
  );

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} opacity={0.5} />
    ),
    []
  );

  type DateOption = { id: DateFilterKind | 'custom'; label: string };
  const dateOptions: DateOption[] = useMemo(
    () => [
      { id: 'all', label: '전체' },
      { id: 'today', label: '오늘' },
      { id: 'thisWeek', label: '이번 주' },
      { id: 'thisMonth', label: '이번 달' },
      { id: 'custom', label: '직접 선택' },
    ],
    []
  );

  const renderDateOption = useCallback(
    ({ item, index }: { item: DateOption; index: number }) => {
      const isSelected =
        item.id === 'custom' ? dateFilterKind === 'custom' : item.id === dateFilterKind;
      return (
        <Pressable
          style={[
            styles.sheetOption,
            index === dateOptions.length - 1 && styles.sheetOptionLast,
            isSelected && styles.sheetOptionSelected,
          ]}
          onPress={() => {
            if (item.id === 'custom') {
              dateSheetRef.current?.close();
              setShowDateModal(true);
            } else {
              setDateFilterKind(item.id);
              dateSheetRef.current?.close();
            }
          }}
        >
          <Text style={styles.sheetOptionText}>{item.label}</Text>
        </Pressable>
      );
    },
    [styles, dateFilterKind]
  );

  const renderItem = ({ item }: { item: RecordWithCompleted }) => (
    <Pressable
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
      onPress={() => navigation.navigate('RecordDetail', { recordId: item.record.id })}
    >
      <View style={styles.itemBar} />
      <View style={styles.itemBody}>
        <View style={styles.itemRow1}>
          <Text style={styles.itemSubject} numberOfLines={1}>{item.record.subjectName}</Text>
          <Text style={styles.itemDate}>{formatDate(item.record.date)}</Text>
        </View>
        <View style={styles.itemRow2}>
          <Text style={styles.itemGroup} numberOfLines={1}>
            {item.record.groupId ? (groupNames[item.record.groupId] ?? '(그룹 없음)') : '커스텀'}
          </Text>
          {item.isCompleted ? <Text style={styles.itemCheck}>✓</Text> : null}
        </View>
      </View>
    </Pressable>
  );

  const filterSummaryText =
    (filterGroupId ? (groups.find(g => g.id === filterGroupId)?.name ?? '') : '전체') +
    (dateFilterKind !== 'all' ? ` · ${dateFilterLabel}` : '') +
    (hideCompleted ? ' · 완료 숨김' : '');

  const listHeader = (
    <View style={styles.filterSection}>
      <View style={styles.filterSectionTopBar} />
      <Pressable
        style={styles.filterHeader}
        onPress={() => setFilterExpanded(prev => !prev)}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.filterTitle}>필터</Text>
          <Text style={styles.filterSummary} numberOfLines={1}>
            {filterExpanded ? '' : ` · ${filterSummaryText || '필터 없음'}`}
          </Text>
        </View>
        <Text style={{ fontSize: 12, color: theme.textSecondary }}>
          {filterExpanded ? '▲ 접기' : '▼ 펼치기'}
        </Text>
      </Pressable>
      {filterExpanded ? (
        <View style={styles.filterBody}>
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="대상 이름 검색"
          placeholderTextColor={theme.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <View style={styles.filterComboWrap}>
        <Pressable
          style={styles.filterComboTrigger}
          onPress={() => groupSheetRef.current?.expand()}
        >
          <Text style={styles.filterComboTriggerText}>
            그룹유형 · {filterGroupId ? (groups.find(g => g.id === filterGroupId)?.name ?? '전체') : '전체'}
          </Text>
          <Text style={styles.filterComboChevron}>{'>'}</Text>
        </Pressable>
      </View>
      <View style={styles.filterDateCompleteRow}>
        <Pressable
          style={styles.filterDateTrigger}
          onPress={() => dateSheetRef.current?.expand()}
        >
          <Text style={styles.filterComboTriggerText}>날짜 · {dateFilterLabel}</Text>
          <Text style={styles.filterComboChevron}>{'>'}</Text>
        </Pressable>
        <Pressable
          style={styles.checkboxRow}
          onPress={() => setHideCompleted(prev => !prev)}
        >
          <Checkbox checked={hideCompleted} onPress={() => setHideCompleted(prev => !prev)} />
          <Text style={styles.checkboxText}>완료 숨기기</Text>
        </Pressable>
      </View>
        </View>
      ) : null}
    </View>
  );

  if (recordsWithStatus.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>아직 기록이 없어요.</Text>
          <Text style={styles.emptyHint}>새 기록 탭에서 기록을 만들어 보세요.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.listWrap}>
        <FlatList
          data={filteredRecords}
          keyExtractor={r => r.record.id}
          renderItem={renderItem}
          ListHeaderComponent={listHeader}
          contentContainerStyle={[styles.list, { paddingBottom: listPaddingBottom }]}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>조건에 맞는 기록이 없어요.</Text>
            </View>
          }
        />
      </View>
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
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 8,
        }}
        handleIndicatorStyle={{ backgroundColor: theme.textTertiary, width: 40 }}
      >
        <BottomSheetFlatList
          data={groupOptions}
          keyExtractor={(item: { id: string | null; name: string }) => item.id ?? 'all'}
          renderItem={renderGroupOption}
          contentContainerStyle={styles.sheetContent}
        />
      </BottomSheet>
      <BottomSheet
        ref={dateSheetRef}
        index={-1}
        snapPoints={['35%', '50%']}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: theme.surface,
          borderTopWidth: 2,
          borderTopColor: theme.borderLight,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 8,
        }}
        handleIndicatorStyle={{ backgroundColor: theme.textTertiary, width: 40 }}
      >
        <BottomSheetFlatList
          data={dateOptions}
          keyExtractor={(item: DateOption) => item.id}
          renderItem={renderDateOption}
          contentContainerStyle={styles.sheetContent}
        />
      </BottomSheet>
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
              <Text style={styles.dateModalTitle}>날짜 선택</Text>
              <View style={styles.dateModalActions}>
                <Pressable
                  onPress={() => setShowDateModal(false)}
                  style={styles.dateModalCancelBtn}
                >
                  <Text style={styles.dateModalCancelText}>취소</Text>
                </Pressable>
                <Pressable
                  onPress={() => setShowDateModal(false)}
                  style={styles.dateModalConfirmBtn}
                >
                  <Text style={styles.dateModalConfirmText}>확인</Text>
                </Pressable>
              </View>
            </View>
            <View style={styles.dateModalDivider} />
            <View style={styles.datePickerWrap}>
              <DateTimePicker
                value={filterDate ? new Date(filterDate + 'T12:00:00') : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                themeVariant={isDark ? 'dark' : 'light'}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
