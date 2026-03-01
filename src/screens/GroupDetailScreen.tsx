import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { GroupsStackParamList } from '../navigation/types';
import { useTheme } from '../theme';
import { loadAll, saveAll } from '../storage';
import { generateId } from '../utils/id';
import type { ChecklistGroup, ChecklistItemTemplate, ChecklistItemType } from '../types';

type Props = NativeStackScreenProps<GroupsStackParamList, 'GroupDetail'>;

export function GroupDetailScreen({ route }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { groupId } = route.params;
  const listPaddingBottom = Math.max(insets.bottom + 56, 80) + 24;
  const [group, setGroup] = useState<ChecklistGroup | null>(null);
  const [items, setItems] = useState<ChecklistItemTemplate[]>([]);
  const [inlineAdding, setInlineAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [editingGroupName, setEditingGroupName] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState('');
  const [editItem, setEditItem] = useState<ChecklistItemTemplate | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState<ChecklistItemType>('check');
  const [editOptions, setEditOptions] = useState<string[]>(['', '']);
  const addInputRef = useRef<TextInput>(null);
  const groupNameInputRef = useRef<TextInput>(null);

  const MIN_OPTIONS = 2;
  const MAX_OPTIONS = 5;

  useEffect(() => {
    if (inlineAdding) addInputRef.current?.focus();
  }, [inlineAdding]);

  useEffect(() => {
    if (editingGroupName) groupNameInputRef.current?.focus();
  }, [editingGroupName]);

  const refresh = useCallback(() => {
    const data = loadAll();
    const g = data.groups.find(gr => gr.id === groupId);
    setGroup(g ?? null);
    if (g) {
      navigation.setOptions({ title: g.name });
      setGroupNameInput(g.name);
    }
    const list = data.templates.filter(t => t.groupId === groupId).sort((a, b) => a.order - b.order);
    setItems(list);
  }, [groupId, navigation]);

  const startEditGroupName = useCallback(() => {
    if (group) {
      setEditingGroupName(true);
      setGroupNameInput(group.name);
    }
  }, [group]);

  const saveGroupName = useCallback(() => {
    const name = groupNameInput.trim();
    if (!name || !group) return;
    const data = loadAll();
    const g = data.groups.find(gr => gr.id === groupId);
    if (g) {
      g.name = name;
      saveAll(data);
      setGroup({ ...group, name });
      navigation.setOptions({ title: name });
    }
    setEditingGroupName(false);
  }, [group, groupId, groupNameInput, navigation]);

  const cancelEditGroupName = useCallback(() => {
    setEditingGroupName(false);
    if (group) setGroupNameInput(group.name);
  }, [group]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const addItem = () => {
    const title = newTitle.trim();
    if (!title || !group) return;
    const data = loadAll();
    const maxOrder = Math.max(0, ...data.templates.filter(t => t.groupId === groupId).map(t => t.order));
    const newItem: ChecklistItemTemplate = {
      id: generateId(),
      groupId,
      title,
      order: maxOrder + 1,
    };
    data.templates.push(newItem);
    saveAll(data);
    setNewTitle('');
    setInlineAdding(false);
    refresh();
  };

  const openEditItem = (item: ChecklistItemTemplate) => {
    setEditItem(item);
    setEditTitle(item.title);
    setEditType(item.itemType ?? 'check');
    const opts = item.options?.length ? [...item.options] : ['', ''];
    setEditOptions(opts.length >= MIN_OPTIONS && opts.length <= MAX_OPTIONS ? opts : ['', '']);
  };

  const saveEditItem = () => {
    const title = editTitle.trim();
    if (!title || !editItem) return;
    const data = loadAll();
    const t = data.templates.find(x => x.id === editItem.id);
    if (!t) return;
    t.title = title;
    if (editType === 'selection') {
      const trimmed = editOptions.map(s => s.trim()).filter(Boolean);
      if (trimmed.length < MIN_OPTIONS || trimmed.length > MAX_OPTIONS) return;
      t.itemType = 'selection';
      t.options = trimmed;
    } else {
      t.itemType = 'check';
      t.options = undefined;
    }
    saveAll(data);
    setEditItem(null);
    setEditTitle('');
    setEditType('check');
    setEditOptions(['', '']);
    refresh();
  };

  const addEditOption = () => {
    if (editOptions.length >= MAX_OPTIONS) return;
    setEditOptions(prev => [...prev, '']);
  };

  const setEditOptionAt = (index: number, value: string) => {
    setEditOptions(prev => prev.map((s, i) => (i === index ? value : s)));
  };

  const removeEditOption = (index: number) => {
    if (editOptions.length <= MIN_OPTIONS) return;
    setEditOptions(prev => prev.filter((_, i) => i !== index));
  };

  const deleteItem = (item: ChecklistItemTemplate) => {
    Alert.alert('항목 삭제', `"${item.title}"을(를) 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          const data = loadAll();
          data.templates = data.templates.filter(t => t.id !== item.id);
          saveAll(data);
          refresh();
        },
      },
    ]);
  };

  const moveItem = useCallback(
    (fromIndex: number, direction: 'up' | 'down') => {
      const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
      if (toIndex < 0 || toIndex >= items.length) return;
      const next = [...items];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);
      const withOrder = next.map((t, i) => ({ ...t, order: i }));
      LayoutAnimation.configureNext({
        duration: 280,
        update: {
          type: LayoutAnimation.Types.easeInEaseOut,
        },
      });
      setItems(withOrder);
      const data = loadAll();
      const other = data.templates.filter(t => t.groupId !== groupId);
      data.templates = [...other, ...withOrder];
      saveAll(data);
    },
    [items, groupId]
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
        header: {
          backgroundColor: theme.surface,
          padding: 16,
          marginHorizontal: 12,
          marginTop: 12,
          borderRadius: 12,
          marginBottom: 8,
          borderWidth: 1,
          borderColor: theme.borderLight,
        },
        groupName: { fontSize: 18, fontWeight: '600', color: theme.text },
        groupNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
        groupNameInput: {
          flex: 1,
          fontSize: 18,
          fontWeight: '600',
          color: theme.text,
          paddingVertical: 4,
          paddingHorizontal: 0,
          margin: 0,
          backgroundColor: 'transparent',
          borderBottomWidth: 1,
          borderBottomColor: theme.primary,
        },
        pencilBtn: { padding: 4 },
        sectionTitle: { fontSize: 15, fontWeight: '600', color: theme.text, marginLeft: 12, marginBottom: 4 },
        sectionHint: { fontSize: 12, color: theme.textSecondary, marginLeft: 12, marginBottom: 8 },
        list: { paddingBottom: 0 },
        listCard: {
          flex: 1,
          marginHorizontal: 12,
          marginBottom: 16,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: theme.borderLight,
          backgroundColor: theme.surface,
          overflow: 'hidden',
        },
        itemDivider: {
          height: 1,
          backgroundColor: theme.borderLight,
          marginLeft: 14,
          marginRight: 14,
        },
        empty: { padding: 24, alignItems: 'center' },
        emptyText: { fontSize: 14, color: theme.textSecondary },
        notFound: { flex: 1, textAlign: 'center', marginTop: 48, fontSize: 16, color: theme.textSecondary },
        itemRow: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.surface,
          paddingVertical: 12,
          paddingHorizontal: 14,
        },
        itemLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: 0 },
        itemIndex: { fontSize: 16, color: theme.textTertiary, marginRight: 10 },
        itemBody: { flex: 1, minWidth: 0 },
        itemRight: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8 },
        orderButtons: { flexDirection: 'row', gap: 4 },
        orderBtn: {
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: theme.orderButton,
          alignItems: 'center',
          justifyContent: 'center',
        },
        orderBtnDisabled: { backgroundColor: theme.orderButtonDisabled, opacity: 0.6 },
        orderBtnText: { fontSize: 18, color: theme.orderButtonText, fontWeight: '600' },
        orderBtnTextDisabled: { color: theme.orderButtonTextDisabled },
        itemTitle: { fontSize: 16, color: theme.text },
        itemSubtitle: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
        deleteBtn: {
          width: 36,
          height: 36,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
        },
        deleteBtnPressed: { opacity: 0.7 },
        deleteBtnIcon: { fontSize: 20 },
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
        modalLabel: { fontSize: 14, fontWeight: '500', color: theme.text, marginBottom: 6 },
        modalTypeRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
        modalTypeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1 },
        modalTypeBtnText: { fontSize: 14 },
        modalOptionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
        modalOptionInput: {
          flex: 1,
          borderWidth: 1,
          borderColor: theme.inputBorder,
          backgroundColor: theme.inputBackground,
          borderRadius: 8,
          padding: 10,
          fontSize: 14,
          color: theme.text,
        },
        modalOptionRemove: { padding: 8 },
        modalOptionRemoveText: { fontSize: 14, color: theme.danger },
        modalAddOption: { paddingVertical: 8, alignItems: 'center', marginBottom: 8 },
        modalAddOptionText: { fontSize: 14, color: theme.primary },
        modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
        modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
        modalBtnCancel: { backgroundColor: theme.buttonSecondary },
        modalBtnCancelText: { color: theme.buttonSecondaryText, fontSize: 16 },
        modalBtnOk: { backgroundColor: theme.primary },
        modalBtnOkText: { color: '#fff', fontSize: 16, fontWeight: '600' },
        addRow: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.surface,
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderWidth: 2,
          borderStyle: 'dashed',
          borderColor: theme.borderLight,
          marginHorizontal: 14,
          marginBottom: 14,
          marginTop: 8,
          borderRadius: 8,
        },
        addRowPressed: { opacity: 0.8 },
        addRowText: { fontSize: 15, color: theme.textSecondary },
        addRowInput: {
          flex: 1,
          borderWidth: 1,
          borderColor: theme.inputBorder,
          backgroundColor: theme.inputBackground,
          borderRadius: 8,
          paddingVertical: 10,
          paddingHorizontal: 12,
          fontSize: 16,
          color: theme.text,
        },
        addRowBtn: {
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderRadius: 8,
          backgroundColor: theme.primary,
          marginLeft: 8,
        },
        addRowBtnCancel: { backgroundColor: theme.buttonSecondary },
        addRowBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
        addRowBtnCancelText: { color: theme.buttonSecondaryText, fontSize: 15 },
      }),
    [theme]
  );

  const renderItem = ({ item, index }: { item: ChecklistItemTemplate; index: number }) => (
    <View style={styles.itemRow}>
      <Pressable style={styles.itemLeft} onPress={() => openEditItem(item)}>
        <Text style={styles.itemIndex}>{index + 1}.</Text>
        <View style={styles.itemBody}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          {item.itemType === 'selection' && item.options?.length ? (
            <Text style={styles.itemSubtitle}>선택형 ({item.options.length}개 보기)</Text>
          ) : null}
        </View>
      </Pressable>
      <View style={styles.itemRight}>
        <View style={styles.orderButtons}>
          <Pressable
            style={[styles.orderBtn, index === 0 && styles.orderBtnDisabled]}
            onPress={() => moveItem(index, 'up')}
            disabled={index === 0}
          >
            <Text style={[styles.orderBtnText, index === 0 && styles.orderBtnTextDisabled]}>↑</Text>
          </Pressable>
          <Pressable
            style={[styles.orderBtn, index === items.length - 1 && styles.orderBtnDisabled]}
            onPress={() => moveItem(index, 'down')}
            disabled={index === items.length - 1}
          >
            <Text
              style={[
                styles.orderBtnText,
                index === items.length - 1 && styles.orderBtnTextDisabled,
              ]}
            >
              ↓
            </Text>
          </Pressable>
        </View>
        <Pressable
          style={({ pressed }) => [styles.deleteBtn, pressed && styles.deleteBtnPressed]}
          onPress={() => deleteItem(item)}
          accessibilityLabel="삭제"
        >
          <Text style={styles.deleteBtnIcon}>🗑</Text>
        </Pressable>
      </View>
    </View>
  );

  if (group == null) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>그룹을 찾을 수 없어요.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {editingGroupName ? (
          <View style={styles.groupNameRow}>
            <TextInput
              ref={groupNameInputRef}
              style={styles.groupNameInput}
              value={groupNameInput}
              onChangeText={setGroupNameInput}
              placeholder="그룹 이름"
              placeholderTextColor={theme.placeholder}
              onSubmitEditing={saveGroupName}
              returnKeyType="done"
              selectTextOnFocus
            />
            <Pressable onPress={saveGroupName} style={styles.pencilBtn}>
              <Feather name="check" size={22} color={theme.primary} />
            </Pressable>
            <Pressable onPress={cancelEditGroupName} style={styles.pencilBtn}>
              <Feather name="x" size={22} color={theme.textSecondary} />
            </Pressable>
          </View>
        ) : (
          <View style={styles.groupNameRow}>
            <Text style={[styles.groupName, { flex: 1 }]}>{group.name}</Text>
            <Pressable onPress={startEditGroupName} style={styles.pencilBtn} accessibilityLabel="이름 수정">
              <Feather name="edit-2" size={20} color={theme.primary} />
            </Pressable>
          </View>
        )}
      </View>

      <Text style={styles.sectionTitle}>체크 항목</Text>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <View style={styles.listCard}>
          <FlatList
            data={items}
            keyExtractor={t => t.id}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={styles.itemDivider} />}
            contentContainerStyle={{ paddingBottom: listPaddingBottom }}
            ListEmptyComponent={
              items.length === 0 && !inlineAdding ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>아래에서 항목을 추가해 보세요.</Text>
                </View>
              ) : null
            }
            ListFooterComponent={
              <>
                {items.length > 0 ? <View style={styles.itemDivider} /> : null}
                {inlineAdding ? (
                  <View style={styles.addRow}>
                    <TextInput
                      ref={addInputRef}
                      style={styles.addRowInput}
                      placeholder="항목 제목"
                      placeholderTextColor={theme.placeholder}
                      value={newTitle}
                      onChangeText={setNewTitle}
                      onSubmitEditing={addItem}
                      returnKeyType="done"
                    />
                    <Pressable
                      style={[styles.addRowBtn, styles.addRowBtnCancel]}
                      onPress={() => { setInlineAdding(false); setNewTitle(''); }}
                    >
                      <Text style={styles.addRowBtnCancelText}>취소</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.addRowBtn, !newTitle.trim() && { opacity: 0.5 }]}
                      onPress={addItem}
                      disabled={!newTitle.trim()}
                    >
                      <Text style={styles.addRowBtnText}>추가</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    style={({ pressed }) => [styles.addRow, pressed && styles.addRowPressed]}
                    onPress={() => setInlineAdding(true)}
                  >
                    <Text style={styles.addRowText}>+ 항목 추가</Text>
                  </Pressable>
                )}
              </>
            }
          />
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={editItem != null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditItem(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setEditItem(null)}>
          <Pressable style={styles.modalBox} onPress={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>항목 수정</Text>
            <ScrollView style={{ maxHeight: 360 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <TextInput
                style={styles.input}
                placeholder="항목 제목"
                placeholderTextColor={theme.placeholder}
                value={editTitle}
                onChangeText={setEditTitle}
                autoFocus
              />
              <Text style={styles.modalLabel}>항목 유형</Text>
              <View style={styles.modalTypeRow}>
                <Pressable
                  style={[
                    styles.modalTypeBtn,
                    editType === 'check' && { borderColor: theme.primary, backgroundColor: theme.surfaceVariant },
                    editType !== 'check' && { borderColor: theme.borderLight },
                  ]}
                  onPress={() => setEditType('check')}
                >
                  <Text style={[styles.modalTypeBtnText, editType === 'check' ? { color: theme.primary, fontWeight: '600' } : { color: theme.textSecondary }]}>
                    일반 체크
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.modalTypeBtn,
                    editType === 'selection' && { borderColor: theme.primary, backgroundColor: theme.surfaceVariant },
                    editType !== 'selection' && { borderColor: theme.borderLight },
                  ]}
                  onPress={() => setEditType('selection')}
                >
                  <Text style={[styles.modalTypeBtnText, editType === 'selection' ? { color: theme.primary, fontWeight: '600' } : { color: theme.textSecondary }]}>
                    선택형 (2~5개)
                  </Text>
                </Pressable>
              </View>
              {editType === 'selection' ? (
                <>
                  <Text style={styles.modalLabel}>보기 (2~5개)</Text>
                  {editOptions.map((opt, i) => (
                    <View key={i} style={styles.modalOptionRow}>
                      <Text style={{ fontSize: 14, color: theme.textTertiary, width: 20 }}>{i + 1}.</Text>
                      <TextInput
                        style={styles.modalOptionInput}
                        placeholder={`보기 ${i + 1}`}
                        placeholderTextColor={theme.placeholder}
                        value={opt}
                        onChangeText={v => setEditOptionAt(i, v)}
                      />
                      {editOptions.length > MIN_OPTIONS ? (
                        <Pressable style={styles.modalOptionRemove} onPress={() => removeEditOption(i)}>
                          <Text style={styles.modalOptionRemoveText}>삭제</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  ))}
                  {editOptions.length < MAX_OPTIONS ? (
                    <Pressable style={styles.modalAddOption} onPress={addEditOption}>
                      <Text style={styles.modalAddOptionText}>+ 보기 추가</Text>
                    </Pressable>
                  ) : null}
                </>
              ) : null}
            </ScrollView>
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setEditItem(null)}
              >
                <Text style={styles.modalBtnCancelText}>취소</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnOk, (!editTitle.trim() || (editType === 'selection' && editOptions.filter(o => o.trim()).length < MIN_OPTIONS)) && { opacity: 0.5 }]}
                onPress={saveEditItem}
                disabled={!editTitle.trim() || (editType === 'selection' && editOptions.filter(o => o.trim()).length < MIN_OPTIONS)}
              >
                <Text style={styles.modalBtnOkText}>저장</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
