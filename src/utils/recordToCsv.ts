/**
 * 기록 데이터를 Excel에서 열 수 있는 CSV 문자열로 변환
 */

import { formatDate } from './date';
import type { ChecklistRecord, ChecklistGroup, RecordItem, ChecklistItemTemplate } from '../types';

type ItemWithMeta = {
  index: number;
  title: string;
  recordItem: RecordItem;
  template?: ChecklistItemTemplate | null;
};

type TFunction = (key: string, params?: Record<string, string | number>) => string;

function escapeCsvCell(value: string | number): string {
  const s = String(value);
  if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function recordToCsv(
  record: ChecklistRecord,
  group: ChecklistGroup | null,
  items: ItemWithMeta[],
  t: TFunction
): string {
  const date = formatDate(record.date);
  const subject = record.subjectName;
  const groupName = record.groupId ? (group?.name ?? t('noGroup')) : t('custom');
  const note = record.overallNote ?? '';

  const headerDate = t('date');
  const headerSubject = t('targetName');
  const headerGroup = t('group');
  const headerNote = t('overallNote');
  const headerNo = 'No';
  const headerItem = t('checkItems');
  const headerStatus = t('csvStatus');
  const headerSelected = t('csvSelectedOption');

  const headerRow = [headerDate, headerSubject, headerGroup, headerNote, headerNo, headerItem, headerStatus, headerSelected].map(escapeCsvCell).join(',');

  const dataRows = items.map(({ index, title, recordItem, template }) => {
    const isSelection = template?.itemType === 'selection' && template.options && template.options.length >= 2;
    const isMultiSelection = template?.itemType === 'selection' && template?.selectionMode === 'multi' && template.options && template.options.length >= 2;
    const selectedIdx = recordItem.selectedOptionIndex;
    const multiIndices = recordItem.selectedOptionIndices ?? [];
    const checked = isSelection
      ? selectedIdx !== undefined
      : isMultiSelection
        ? multiIndices.length > 0
        : recordItem.checked;
    const statusText = checked ? t('pdfDone') : t('pdfPending');
    let selectedValue = '';
    if (isSelection && template?.options && selectedIdx != null && template.options[selectedIdx] != null) {
      selectedValue = template.options[selectedIdx];
    } else if (isMultiSelection && template?.options && multiIndices.length > 0) {
      selectedValue = multiIndices
        .map(i => (template!.options![i] != null ? template!.options![i] : ''))
        .filter(Boolean)
        .join('; ');
    }
    return [date, subject, groupName, note, index, title || '', statusText, selectedValue].map(escapeCsvCell).join(',');
  });

  const BOM = '\uFEFF';
  return BOM + [headerRow, ...dataRows].join('\r\n');
}
