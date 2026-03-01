/**
 * MMKV 스토리지 래퍼
 * 네이티브 미연동 시 메모리 폴백으로 앱은 동작하고, 개발 시 콘솔 경고만 출력
 */

import { STORAGE_KEYS } from '../constants';
import type {
  ChecklistGroup,
  ChecklistItemTemplate,
  ChecklistRecord,
  RecordItem,
} from '../types';

export type StorageData = {
  groups: ChecklistGroup[];
  templates: ChecklistItemTemplate[];
  records: ChecklistRecord[];
  recordItems: RecordItem[];
};

let storage: import('react-native-mmkv').MMKV | null = null;
let memoryFallback: StorageData = {
  groups: [],
  templates: [],
  records: [],
  recordItems: [],
};

function getStorage(): import('react-native-mmkv').MMKV | null {
  if (storage !== null) return storage;
  try {
    const { createMMKV } = require('react-native-mmkv');
    storage = createMMKV({ id: 'checklist-app' });
    return storage;
  } catch (e) {
    if (__DEV__) {
      console.warn(
        '[storage] MMKV 네이티브 모듈을 사용할 수 없습니다. 메모리 폴백 사용. iOS: pod install 후 재빌드, Android: 재빌드 필요.',
        e
      );
    }
    return null;
  }
}

function parseJson<T>(key: string, fallback: T, inst: import('react-native-mmkv').MMKV): T {
  const raw = inst.getString(key);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadAll(): StorageData {
  const inst = getStorage();
  if (inst == null) {
    return JSON.parse(JSON.stringify(memoryFallback));
  }
  return {
    groups: parseJson(STORAGE_KEYS.CHECKLIST_GROUPS, [], inst),
    templates: parseJson(STORAGE_KEYS.CHECKLIST_TEMPLATES, [], inst),
    records: parseJson(STORAGE_KEYS.CHECKLIST_RECORDS, [], inst),
    recordItems: parseJson(STORAGE_KEYS.RECORD_ITEMS, [], inst),
  };
}

export function saveAll(data: StorageData): void {
  const inst = getStorage();
  if (inst == null) {
    memoryFallback = data;
    return;
  }
  inst.set(STORAGE_KEYS.CHECKLIST_GROUPS, JSON.stringify(data.groups));
  inst.set(STORAGE_KEYS.CHECKLIST_TEMPLATES, JSON.stringify(data.templates));
  inst.set(STORAGE_KEYS.CHECKLIST_RECORDS, JSON.stringify(data.records));
  inst.set(STORAGE_KEYS.RECORD_ITEMS, JSON.stringify(data.recordItems));
}
