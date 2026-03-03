/**
 * 기록 데이터를 .xlsx(Excel) 바이너리로 변환 후 base64 문자열 반환
 */

import * as XLSX from 'xlsx';
import { formatDate } from './date';
import type { ChecklistRecord, ChecklistGroup, RecordItem, ChecklistItemTemplate } from '../types';

type ItemWithMeta = {
  index: number;
  title: string;
  recordItem: RecordItem;
  template?: ChecklistItemTemplate | null;
};

type TFunction = (key: string, params?: Record<string, string | number>) => string;

function u8ToBase64(u8: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < u8.length; i++) {
    binary += String.fromCharCode(u8[i]);
  }
  return btoa(binary);
}

export function recordToXlsxBase64(
  record: ChecklistRecord,
  group: ChecklistGroup | null,
  items: ItemWithMeta[],
  t: TFunction
): string {
  const date = formatDate(record.date);
  const subject = record.subjectName;
  const groupName = record.groupId ? (group?.name ?? t('noGroup')) : t('custom');
  const note = record.overallNote ?? '';

  const headerRow = [
    t('date'),
    t('targetName'),
    t('group'),
    t('overallNote'),
    'No',
    t('checkItems'),
    t('csvStatus'),
    t('csvSelectedOption'),
  ];

  const dataRows = items.map(({ index, title, recordItem, template }) => {
    const isSelection = template?.itemType === 'selection' && template.options && template.options.length >= 2;
    const selectedIdx = recordItem.selectedOptionIndex;
    const checked = isSelection ? selectedIdx !== undefined : recordItem.checked;
    const statusText = checked ? t('pdfDone') : t('pdfPending');
    let selectedValue = '';
    if (isSelection && template?.options && selectedIdx != null && template.options[selectedIdx] != null) {
      selectedValue = template.options[selectedIdx];
    }
    return [date, subject, groupName, note, index, title || '', statusText, selectedValue];
  });

  const aoa = [headerRow, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Record');

  const u8 = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return u8ToBase64(u8);
}
