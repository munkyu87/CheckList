import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { RectButton, Swipeable } from 'react-native-gesture-handler';
import Feather from 'react-native-vector-icons/Feather';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { GroupsStackParamList } from '../navigation/types';
import { DEFAULT_SUBJECT_LABEL } from '../constants';
import { useLanguage } from '../i18n';
import { useTheme } from '../theme';
import { loadAll, saveAll } from '../storage';
import { formatDate } from '../utils/date';
import { generateId } from '../utils/id';
import type { ChecklistGroup } from '../types';

export type GroupSortOrder = 'name' | 'createdAt' | 'recordCount';

type Nav = NativeStackNavigationProp<GroupsStackParamList, 'GroupList'>;

export function GroupListScreen() {
  const { theme, cardShadow } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation<Nav>();
  const [groups, setGroups] = useState<ChecklistGroup[]>([]);
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({});
  const [firstItemTitles, setFirstItemTitles] = useState<Record<string, string>>({});
  const [recordCountByGroup, setRecordCountByGroup] = useState<Record<string, number>>({});
  const [sortOrder, setSortOrder] = useState<GroupSortOrder>('createdAt');
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
        sortRow: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4, gap: 8 },
        sortChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.borderLight },
        sortChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
        sortChipText: { fontSize: 14, color: theme.textSecondary },
        sortChipTextActive: { color: '#fff', fontWeight: '600' },
        list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, flexGrow: 1 },
        empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
        emptyText: { fontSize: 16, color: theme.text, marginBottom: 8 },
        emptyHint: { fontSize: 14, color: theme.textSecondary },
        swipeableContainer: {
          borderRadius: 12,
          overflow: 'hidden',
          marginBottom: 8,
        },
        item: {
          flexDirection: 'row',
          alignItems: 'stretch',
          backgroundColor: theme.surface,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: theme.borderLight,
          ...cardShadow,
        },
        itemIconWrap: {
          width: 44,
          alignItems: 'center',
          justifyContent: 'center',
        },
        itemIconCircle: {
          width: 30,
          height: 30,
          borderRadius: 15,
          backgroundColor: theme.surfaceVariant,
          alignItems: 'center',
          justifyContent: 'center',
        },
        itemIcon: { color: theme.primary },
        itemContent: {
          flex: 1,
          minWidth: 0,
          paddingVertical: 14,
          paddingRight: 14,
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        },
        itemPressed: { opacity: 0.8 },
        itemLeft: { flex: 1, minWidth: 0 },
        itemName: { fontSize: 17, fontWeight: '600', color: theme.text },
        itemSubtext: { fontSize: 13, color: theme.textSecondary, marginTop: 4 },
        itemRight: { alignItems: 'flex-end', justifyContent: 'center', marginLeft: 8 },
        itemDateRight: { fontSize: 13, color: theme.textSecondary, marginBottom: 4 },
        itemRecordBadge: {
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 999,
          backgroundColor: theme.surfaceVariant,
        },
        itemRecordBadgeText: { fontSize: 11, color: theme.textTertiary, fontWeight: '500' },
        swipeDeleteAction: {
          alignSelf: 'stretch',
          backgroundColor: theme.danger,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 12,
          minWidth: 64,
          borderWidth: 0,
          borderTopRightRadius: 12,
          borderBottomRightRadius: 12,
        },
        modalOverlay: {
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          padding: 24,
        },
        modalBox: { backgroundColor: theme.surface, borderRadius: 16, padding: 20 },
        modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16, color: theme.text },
        input: {
          borderWidth: 1,
          borderColor: theme.inputBorder,
          backgroundColor: theme.inputBackground,
          borderRadius: 10,
          padding: 12,
          fontSize: 16,
          marginBottom: 12,
          color: theme.text,
        },
        modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
        modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
        modalBtnCancel: { backgroundColor: theme.buttonSecondary },
        modalBtnCancelText: { color: theme.buttonSecondaryText, fontSize: 16 },
        modalBtnOk: { backgroundColor: theme.primary },
        modalBtnOkText: { color: '#fff', fontSize: 16, fontWeight: '600' },
      }),
    [theme, cardShadow]
  );

  const refresh = useCallback(() => {
    const data = loadAll();
    setGroups(data.groups);
    const counts: Record<string, number> = {};
    const firstTitles: Record<string, string> = {};
    const recordCounts: Record<string, number> = {};
    data.templates
      .sort((a, b) => a.order - b.order)
      .forEach(t => {
        counts[t.groupId] = (counts[t.groupId] ?? 0) + 1;
        if (!firstTitles[t.groupId]) firstTitles[t.groupId] = t.title;
      });
    data.records.forEach(r => {
      if (r.groupId) recordCounts[r.groupId] = (recordCounts[r.groupId] ?? 0) + 1;
    });
    setItemCounts(counts);
    setFirstItemTitles(firstTitles);
    setRecordCountByGroup(recordCounts);
  }, []);

  const sortedGroups = useMemo(() => {
    const list = [...groups];
    if (sortOrder === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    } else if (sortOrder === 'createdAt') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      list.sort((a, b) => (recordCountByGroup[b.id] ?? 0) - (recordCountByGroup[a.id] ?? 0));
    }
    return list;
  }, [groups, sortOrder, recordCountByGroup]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const openAdd = useCallback(() => {
    setNewName('');
    setModalVisible(true);
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={openAdd} hitSlop={8} style={{ padding: 8 }}>
          <Feather name="plus" size={22} color={theme.primary} />
        </Pressable>
      ),
    });
  }, [navigation, openAdd, theme.primary]);

  const saveGroupModal = () => {
    const name = newName.trim();
    if (!name) return;
    const data = loadAll();
    const newGroup: ChecklistGroup = {
      id: generateId(),
      name,
      subjectLabel: DEFAULT_SUBJECT_LABEL,
      createdAt: new Date().toISOString(),
    };
    data.groups.push(newGroup);
    saveAll(data);
    setModalVisible(false);
    refresh();
  };

  const deleteGroup = (group: ChecklistGroup) => {
    Alert.alert(
      t('deleteGroupTitle'),
      t('deleteGroupConfirmMessage', { name: group.name }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => {
            const data = loadAll();
            data.groups = data.groups.filter(g => g.id !== group.id);
            data.templates = data.templates.filter(t => t.groupId !== group.id);
            saveAll(data);
            refresh();
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: ChecklistGroup }) => {
    const count = itemCounts[item.id] ?? 0;
    const firstTitle = firstItemTitles[item.id];
    const createdStr = item.createdAt ? formatDate(item.createdAt.slice(0, 10)) : '';
    const recordCount = recordCountByGroup[item.id] ?? 0;
    const countStr =
      count === 0
        ? t('itemsCountZero')
        : count === 1
          ? t('itemsCountOne')
          : firstTitle
            ? t('itemsCountMany', { first: firstTitle, rest: count - 1 })
            : t('itemsCountOnly', { count });

    return (
      <Swipeable
        containerStyle={styles.swipeableContainer}
        renderRightActions={(_, __, swipeable) => (
          <RectButton
            style={styles.swipeDeleteAction}
            onPress={() => {
              swipeable.close();
              deleteGroup(item);
            }}
          >
            <Feather name="trash-2" size={22} color="#fff" />
          </RectButton>
        )}
        friction={2}
        rightThreshold={40}
      >
        <View style={styles.item}>
          <View style={styles.itemIconWrap}>
            <View style={styles.itemIconCircle}>
              <Feather name="check-square" size={18} style={styles.itemIcon} />
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [styles.itemContent, pressed && styles.itemPressed]}
            onPress={() => navigation.navigate('GroupDetail', { groupId: item.id })}
          >
            <View style={styles.itemLeft}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemSubtext}>{countStr}</Text>
            </View>
            <View style={styles.itemRight}>
              {createdStr ? <Text style={styles.itemDateRight}>{createdStr}</Text> : null}
              {recordCount > 0 ? (
                <View style={styles.itemRecordBadge}>
                  <Text style={styles.itemRecordBadgeText}>{`${recordCount} ${t('recordsShort')}`}</Text>
                </View>
              ) : null}
            </View>
          </Pressable>
        </View>
      </Swipeable>
    );
  };

  return (
    <View style={styles.container}>
      {groups.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t('emptyGroups')}</Text>
          <Text style={styles.emptyHint}>{t('emptyGroupsHint')}</Text>
        </View>
      ) : (
        <>
          <View style={styles.sortRow}>
            <Pressable
              style={[styles.sortChip, sortOrder === 'name' && styles.sortChipActive]}
              onPress={() => setSortOrder('name')}
            >
              <Text style={[styles.sortChipText, sortOrder === 'name' && styles.sortChipTextActive]}>{t('sortByName')}</Text>
            </Pressable>
            <Pressable
              style={[styles.sortChip, sortOrder === 'createdAt' && styles.sortChipActive]}
              onPress={() => setSortOrder('createdAt')}
            >
              <Text style={[styles.sortChipText, sortOrder === 'createdAt' && styles.sortChipTextActive]}>{t('sortByDate')}</Text>
            </Pressable>
            <Pressable
              style={[styles.sortChip, sortOrder === 'recordCount' && styles.sortChipActive]}
              onPress={() => setSortOrder('recordCount')}
            >
              <Text style={[styles.sortChipText, sortOrder === 'recordCount' && styles.sortChipTextActive]}>{t('sortByCount')}</Text>
            </Pressable>
          </View>
          <FlatList
            data={sortedGroups}
            keyExtractor={g => g.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
          />
        </>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalBox} onPress={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{t('newGroup')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('groupNamePlaceholder')}
              placeholderTextColor={theme.placeholder}
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Pressable style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalBtnCancelText}>{t('cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnOk, !newName.trim() && { opacity: 0.5 }]}
                onPress={saveGroupModal}
                disabled={!newName.trim()}
              >
                <Text style={styles.modalBtnOkText}>{t('add')}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
