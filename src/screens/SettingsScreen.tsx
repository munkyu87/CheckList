import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Share from 'react-native-share';
import Feather from 'react-native-vector-icons/Feather';
import { Checkbox } from '../components';
import { useLanguage } from '../i18n';
import { useTheme } from '../theme';
import { APP_VERSION } from '../constants';
import { loadAll, saveAll } from '../storage';
import { generateId } from '../utils/id';
import {
  createBackupPayload,
  parseBackupPayload,
  mergeRestorePayload,
} from '../utils/groupBackup';
import type { ChecklistGroup } from '../types';

const BACKUP_FILENAME = 'ThinkLess-GroupBackup.json';

export function SettingsScreen() {
  const { theme, isDark, mode, setThemeMode } = useTheme();
  const { locale, setLocale, t } = useLanguage();
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [backupGroupModalVisible, setBackupGroupModalVisible] = useState(false);
  const [groups, setGroups] = useState<ChecklistGroup[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<Record<string, boolean>>({});

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
        content: { padding: 20 },
        sectionTitle: {
          fontSize: 14,
          fontWeight: '600',
          color: theme.textSecondary,
          marginBottom: 12,
          marginLeft: 4,
        },
        menuRow: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.surface,
          padding: 16,
          borderRadius: 12,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: theme.borderLight,
        },
        menuRowPressed: { opacity: 0.8 },
        menuIcon: { marginRight: 14 },
        menuText: { flex: 1, fontSize: 16, color: theme.text },
        menuSubtext: { fontSize: 13, color: theme.textSecondary, marginTop: 2 },
        menuValue: { fontSize: 15, color: theme.textSecondary, marginRight: 4 },
        menuArrow: { color: theme.textTertiary },
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
          maxHeight: '80%',
        },
        modalTitleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        },
        modalTitle: { fontSize: 18, fontWeight: '600', color: theme.text, flex: 1 },
        modalSelectAllBtn: {
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 8,
          backgroundColor: theme.surfaceVariant,
        },
        modalSelectAllBtnText: { fontSize: 14, color: theme.primary, fontWeight: '600' },
        groupItemRow: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          paddingHorizontal: 4,
          borderBottomWidth: 1,
          borderBottomColor: theme.borderLight,
        },
        groupItemTitle: { flex: 1, fontSize: 16, color: theme.text, marginLeft: 12 },
        modalButtons: { flexDirection: 'row', gap: 12, marginTop: 16 },
        modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
        modalBtnCancel: { backgroundColor: theme.buttonSecondary },
        modalBtnCancelText: { color: theme.buttonSecondaryText, fontSize: 16 },
        modalBtnExport: { backgroundColor: theme.primary },
        modalBtnExportText: { color: '#fff', fontSize: 16, fontWeight: '600' },
      }),
    [theme]
  );

  const openBackupModal = useCallback(() => {
    const data = loadAll();
    setGroups(data.groups);
    const initial: Record<string, boolean> = {};
    data.groups.forEach(g => {
      initial[g.id] = true;
    });
    setSelectedGroupIds(initial);
    setBackupGroupModalVisible(true);
  }, []);

  const toggleGroupSelection = useCallback((groupId: string) => {
    setSelectedGroupIds(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  }, []);

  const selectAllGroups = useCallback(() => {
    setSelectedGroupIds(prev => {
      const next = { ...prev };
      groups.forEach(g => {
        next[g.id] = true;
      });
      return next;
    });
  }, [groups]);

  const deselectAllGroups = useCallback(() => {
    setSelectedGroupIds(prev => {
      const next = { ...prev };
      groups.forEach(g => {
        next[g.id] = false;
      });
      return next;
    });
  }, [groups]);

  const doExportSelectedGroups = useCallback(async () => {
    const data = loadAll();
    const ids = new Set(Object.keys(selectedGroupIds).filter(id => selectedGroupIds[id]));
    if (ids.size === 0) {
      Alert.alert(t('selectAtLeastOne'), t('selectAtLeastOneMessage'));
      return;
    }
    const selectedGroups = data.groups.filter(g => ids.has(g.id));
    const selectedTemplates = data.templates.filter(t => ids.has(t.groupId));
    setBackupGroupModalVisible(false);
    setBackingUp(true);
    try {
      const payload = createBackupPayload(selectedGroups, selectedTemplates);
      const json = JSON.stringify(payload, null, 2);
      const dir = ReactNativeBlobUtil.fs.dirs.CacheDir;
      const path = `${dir}/${BACKUP_FILENAME}`;
      await ReactNativeBlobUtil.fs.writeFile(path, json, 'utf8');
      const fileUrl = path.startsWith('file://') ? path : `file://${path}`;
      await Share.open({
        url: fileUrl,
        type: 'application/json',
        title: t('backupShareTitle'),
        filename: BACKUP_FILENAME,
      });
    } catch (err) {
      if ((err as { message?: string })?.message?.includes('User did not share')) {
        // 사용자가 공유 취소
      } else {
        Alert.alert(t('backupFailed'), t('backupError'));
      }
    } finally {
      setBackingUp(false);
    }
  }, [selectedGroupIds, t]);

  const handleRestore = useCallback(async () => {
    setRestoring(true);
    try {
      const res = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.json, 'application/json'],
        copyTo: 'cachesDirectory',
      });
      const fileUri = res.fileCopyUri ?? res.uri;
      if (!fileUri) {
        Alert.alert(t('restoreFailed'), t('restoreInvalidFile'));
        return;
      }
      const path = fileUri.startsWith('file://') ? fileUri.replace('file://', '') : fileUri;
      const json = await ReactNativeBlobUtil.fs.readFile(path, 'utf8');
      const payload = parseBackupPayload(json);
      if (!payload) {
        Alert.alert(t('restoreFailed'), t('restoreInvalidFile'));
        return;
      }
      Alert.alert(
        t('restoreConfirmTitle'),
        t('restoreConfirmMessage', { count: payload.groups.length }),
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('restore'),
            onPress: () => {
              const data = loadAll();
              const merged = mergeRestorePayload(data, payload, generateId);
              saveAll(merged);
              Alert.alert(t('restoreDoneTitle'), t('restoreDone'));
            },
          },
        ]
      );
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // 사용자가 파일 선택 취소
      } else {
        Alert.alert(t('restoreFailed'), t('restoreError'));
      }
    } finally {
      setRestoring(false);
    }
  }, [t]);

  const selectedCount = useMemo(
    () => Object.keys(selectedGroupIds).filter(id => selectedGroupIds[id]).length,
    [selectedGroupIds]
  );

  const allSelected = groups.length > 0 && selectedCount === groups.length;
  const toggleSelectAll = useCallback(() => {
    if (allSelected) deselectAllGroups();
    else selectAllGroups();
  }, [allSelected, selectAllGroups, deselectAllGroups]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 24 }}>
        <Text style={styles.sectionTitle}>{t('theme')}</Text>
        <Pressable
          style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
          onPress={() =>
            setThemeMode(
              mode === 'light'
                ? 'sakura'
                : mode === 'sakura'
                  ? 'ocean'
                  : mode === 'ocean'
                    ? 'midnight'
                    : mode === 'midnight'
                      ? 'forest'
                      : 'light'
            )
          }
        >
          <View style={styles.menuIcon}>
            <Feather
              name={
                mode === 'sakura'
                  ? 'sun'
                  : mode === 'ocean'
                    ? 'droplet'
                    : mode === 'midnight'
                      ? 'star'
                      : mode === 'forest'
                        ? 'feather'
                        : 'sun'
              }
              size={22}
              color={theme.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuText}>{t('theme')}</Text>
            <Text style={styles.menuSubtext}>
              {mode === 'light'
                ? t('themeLight')
                : mode === 'sakura'
                  ? t('themeSakura')
                  : mode === 'ocean'
                    ? t('themeOcean')
                    : mode === 'midnight'
                      ? t('themeMidnight')
                      : t('themeForest')}
            </Text>
          </View>
          <Text style={styles.menuValue}>
            {mode === 'light'
              ? t('themeLight')
              : mode === 'sakura'
                ? t('themeSakura')
                : mode === 'ocean'
                  ? t('themeOcean')
                  : mode === 'midnight'
                    ? t('themeMidnight')
                    : t('themeForest')}
          </Text>
          <Feather name="chevron-right" size={20} color={theme.textTertiary} />
        </Pressable>

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>{t('language')}</Text>
        <Pressable
          style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
          onPress={() => setLocale(locale === 'ko' ? 'en' : 'ko')}
        >
          <View style={styles.menuIcon}>
            <Feather name="globe" size={22} color={theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuText}>{t('language')}</Text>
            <Text style={styles.menuSubtext}>{locale === 'ko' ? t('languageKo') : t('languageEn')}</Text>
          </View>
          <Text style={styles.menuValue}>{locale === 'ko' ? t('languageKo') : t('languageEn')}</Text>
          <Feather name="chevron-right" size={20} color={theme.textTertiary} />
        </Pressable>

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>{t('group')}</Text>
        <Pressable
          style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
          onPress={openBackupModal}
          disabled={backingUp}
        >
          <View style={styles.menuIcon}>
            <Feather name="download" size={22} color={theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuText}>{t('groupBackup')}</Text>
            <Text style={styles.menuSubtext}>{t('groupBackupDesc')}</Text>
          </View>
          {backingUp ? (
            <Text style={styles.menuArrow}>...</Text>
          ) : (
            <Feather name="chevron-right" size={20} color={theme.textTertiary} />
          )}
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
          onPress={handleRestore}
          disabled={restoring}
        >
          <View style={styles.menuIcon}>
            <Feather name="upload" size={22} color={theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuText}>{t('groupRestore')}</Text>
            <Text style={styles.menuSubtext}>{t('groupRestoreDesc')}</Text>
          </View>
          {restoring ? (
            <Text style={styles.menuArrow}>...</Text>
          ) : (
            <Feather name="chevron-right" size={20} color={theme.textTertiary} />
          )}
        </Pressable>

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>{t('version')}</Text>
        <View style={styles.menuRow}>
          <View style={styles.menuIcon}>
            <Feather name="info" size={22} color={theme.textTertiary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuText}>{t('version')}</Text>
            <Text style={styles.menuSubtext}>ThinkLess</Text>
          </View>
          <Text style={styles.menuValue}>{APP_VERSION}</Text>
        </View>
      </ScrollView>

      <Modal
        visible={backupGroupModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBackupGroupModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setBackupGroupModalVisible(false)}>
          <Pressable style={styles.modalBox} onPress={e => e.stopPropagation()}>
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalTitle}>{t('selectGroupsToShare')}</Text>
              <Pressable style={styles.modalSelectAllBtn} onPress={toggleSelectAll}>
                <Text style={styles.modalSelectAllBtnText}>
                  {allSelected ? t('deselectAll') : t('selectAll')}
                </Text>
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator>
              {groups.map(g => (
                <Pressable
                  key={g.id}
                  style={styles.groupItemRow}
                  onPress={() => toggleGroupSelection(g.id)}
                >
                  <Checkbox
                    checked={!!selectedGroupIds[g.id]}
                    onPress={() => toggleGroupSelection(g.id)}
                    size={22}
                  />
                  <Text style={styles.groupItemTitle} numberOfLines={1}>
                    {g.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setBackupGroupModalVisible(false)}
              >
                <Text style={styles.modalBtnCancelText}>{t('cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnExport, selectedCount === 0 && { opacity: 0.5 }]}
                onPress={doExportSelectedGroups}
                disabled={selectedCount === 0}
              >
                <Text style={styles.modalBtnExportText}>{t('exportCount', { count: selectedCount })}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
