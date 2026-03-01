import React, { useCallback, useMemo, useState } from 'react';
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
import { useTheme } from '../theme';
import { loadAll, saveAll } from '../storage';
import { generateId } from '../utils/id';
import type { ChecklistGroup } from '../types';

type Nav = NativeStackNavigationProp<GroupsStackParamList, 'GroupList'>;

export function GroupListScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<Nav>();
  const [groups, setGroups] = useState<ChecklistGroup[]>([]);
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({});
  const [firstItemTitles, setFirstItemTitles] = useState<Record<string, string>>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
        list: { padding: 12, paddingBottom: 120, flexGrow: 1 },
        empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
        emptyText: { fontSize: 16, color: theme.text, marginBottom: 8 },
        emptyHint: { fontSize: 14, color: theme.textSecondary },
        item: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.surface,
          padding: 16,
          borderRadius: 12,
          marginBottom: 8,
          borderWidth: 1,
          borderColor: theme.borderLight,
        },
        itemPressed: { opacity: 0.8 },
        itemContent: { flex: 1, minWidth: 0 },
        itemName: { fontSize: 17, fontWeight: '600', color: theme.text },
        itemSubtext: { fontSize: 13, color: theme.textSecondary, marginTop: 4 },
        swipeDeleteAction: {
          backgroundColor: theme.danger,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 16,
          minWidth: 80,
        },
        swipeDeleteText: { color: '#fff', fontSize: 16, fontWeight: '600' },
        fab: {
          position: 'absolute',
          right: 20,
          bottom: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: theme.primary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        fabPressed: { opacity: 0.9 },
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
    [theme]
  );

  const refresh = useCallback(() => {
    const data = loadAll();
    setGroups(data.groups);
    const counts: Record<string, number> = {};
    const firstTitles: Record<string, string> = {};
    data.templates
      .sort((a, b) => a.order - b.order)
      .forEach(t => {
        counts[t.groupId] = (counts[t.groupId] ?? 0) + 1;
        if (!firstTitles[t.groupId]) firstTitles[t.groupId] = t.title;
      });
    setItemCounts(counts);
    setFirstItemTitles(firstTitles);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const openAdd = () => {
    setNewName('');
    setModalVisible(true);
  };

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
      '그룹 삭제',
      `"${group.name}"을(를) 삭제할까요? 이 그룹의 체크 항목도 모두 삭제됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
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
    const subtext =
      count === 0
        ? '0개 항목'
        : count === 1
          ? '1개 항목'
          : firstTitle
            ? `${firstTitle} 외 ${count - 1}개 항목`
            : `${count}개 항목`;

    return (
      <Swipeable
        renderRightActions={(_, __, swipeable) => (
          <RectButton
            style={styles.swipeDeleteAction}
            onPress={() => {
              swipeable.close();
              deleteGroup(item);
            }}
          >
            <Text style={styles.swipeDeleteText}>삭제</Text>
          </RectButton>
        )}
        friction={2}
        rightThreshold={40}
      >
        <View style={styles.item}>
          <Pressable
            style={({ pressed }) => [styles.itemContent, pressed && styles.itemPressed]}
            onPress={() => navigation.navigate('GroupDetail', { groupId: item.id })}
          >
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemSubtext}>{subtext}</Text>
          </Pressable>
        </View>
      </Swipeable>
    );
  };

  return (
    <View style={styles.container}>
      {groups.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>등록된 그룹이 없어요.</Text>
          <Text style={styles.emptyHint}>아래 버튼으로 그룹을 추가해 보세요.</Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={g => g.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}

      <Pressable style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]} onPress={openAdd}>
        <Feather name="plus" size={28} color="#fff" />
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalBox} onPress={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>새 그룹</Text>
            <TextInput
              style={styles.input}
              placeholder="그룹 이름"
              placeholderTextColor={theme.placeholder}
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Pressable style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalBtnCancelText}>취소</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnOk, !newName.trim() && { opacity: 0.5 }]}
                onPress={saveGroupModal}
                disabled={!newName.trim()}
              >
                <Text style={styles.modalBtnOkText}>추가</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
