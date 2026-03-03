/**
 * 그룹·템플릿 백업 포맷 (기록은 제외)
 */
export interface GroupBackupPayload {
  version: number;
  exportedAt: string;
  groups: Array<{
    id: string;
    name: string;
    subjectLabel: string;
    createdAt: string;
  }>;
  templates: Array<{
    id: string;
    groupId: string;
    title: string;
    order: number;
    itemType?: 'check' | 'selection';
    options?: string[];
  }>;
}

export const BACKUP_VERSION = 1;

export function createBackupPayload(
  groups: GroupBackupPayload['groups'],
  templates: GroupBackupPayload['templates']
): GroupBackupPayload {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    groups: groups.map(g => ({
      id: g.id,
      name: g.name,
      subjectLabel: g.subjectLabel,
      createdAt: g.createdAt,
    })),
    templates: templates.map(t => ({
      id: t.id,
      groupId: t.groupId,
      title: t.title,
      order: t.order,
      itemType: t.itemType,
      options: t.options,
    })),
  };
}

export function parseBackupPayload(json: string): GroupBackupPayload | null {
  try {
    const raw = JSON.parse(json) as unknown;
    if (raw && typeof raw === 'object' && 'version' in raw && 'groups' in raw && 'templates' in raw) {
      const payload = raw as GroupBackupPayload;
      if (Array.isArray(payload.groups) && Array.isArray(payload.templates)) {
        return payload;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

import type { StorageData } from '../storage';

/**
 * 백업 payload를 기존 데이터에 병합. 그룹·템플릿만 새 ID로 추가 (기록 유지).
 */
export function mergeRestorePayload(
  currentData: StorageData,
  payload: GroupBackupPayload,
  generateId: () => string
): StorageData {
  const newGroupIdMap: Record<string, string> = {};
  const newTemplateIdMap: Record<string, string> = {};

  const newGroups = payload.groups.map(g => {
    const newId = generateId();
    newGroupIdMap[g.id] = newId;
    return {
      id: newId,
      name: g.name,
      subjectLabel: g.subjectLabel,
      createdAt: g.createdAt,
    };
  });

  const newTemplates = payload.templates.map(t => {
    const newId = generateId();
    newTemplateIdMap[t.id] = newId;
    const newGroupId = newGroupIdMap[t.groupId] ?? t.groupId;
    return {
      id: newId,
      groupId: newGroupId,
      title: t.title,
      order: t.order,
      itemType: t.itemType,
      options: t.options,
    };
  });

  return {
    ...currentData,
    groups: [...currentData.groups, ...newGroups],
    templates: [...currentData.templates, ...newTemplates],
  };
}
