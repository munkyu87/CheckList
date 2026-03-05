/**
 * 기록 데이터를 PDF용 HTML로 변환
 */

import { formatDate } from './date';
import type { ChecklistRecord, ChecklistGroup, RecordItem, ChecklistItemTemplate } from '../types';

type ItemWithMeta = {
  index: number;
  title: string;
  recordItem: RecordItem;
  template?: ChecklistItemTemplate | null;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

type TFunction = (key: string, params?: Record<string, string | number>) => string;

const defaultT: TFunction = (key: string, params?: Record<string, string | number>) => {
  if (key === 'optionLabel' && params?.num != null) return `보기 ${params.num}`;
  const fallback: Record<string, string> = {
    checkItems: '체크 항목',
    noGroup: '(그룹 없음)',
    custom: '커스텀',
    pdfDone: '완료',
    pdfPending: '미완료',
  };
  return fallback[key] ?? key;
};

export function recordToPdfHtml(
  record: ChecklistRecord,
  group: ChecklistGroup | null,
  items: ItemWithMeta[],
  t: TFunction = defaultT
): string {
  const date = formatDate(record.date);
  const subject = escapeHtml(record.subjectName);
  const groupName = record.groupId ? escapeHtml(group?.name ?? t('noGroup')) : t('custom');
  const note = record.overallNote ? escapeHtml(record.overallNote) : '';

  const rows = items
    .map(({ index, title, recordItem, template }) => {
      const isSelection = template?.itemType === 'selection' && template.options && template.options.length >= 2;
      const isMultiSelection = template?.itemType === 'selection' && template?.selectionMode === 'multi' && template.options && template.options.length >= 2;
      const selectedIdx = recordItem.selectedOptionIndex;
      const multiIndices = recordItem.selectedOptionIndices ?? [];
      const checked = isSelection
        ? selectedIdx !== undefined
        : isMultiSelection
          ? multiIndices.length > 0
          : recordItem.checked;
      const statusText = checked ? `✓ ${t('pdfDone')}` : `○ ${t('pdfPending')}`;
      const statusClass = checked ? 'status-done' : 'status-pending';

      let optionsHtml = '';
      if (isSelection && template!.options!.length > 0) {
        optionsHtml = template!.options!
          .map(
            (opt, oi) =>
              `<div class="option-row"><span class="option-num">${oi + 1}.</span>
  <span class="option-radio ${selectedIdx === oi ? 'selected' : ''}">${selectedIdx === oi ? '●' : '○'}</span>
  <span class="option-label">${escapeHtml(opt || t('optionLabel', { num: oi + 1 }))}</span></div>`
          )
          .join('');
        optionsHtml = `<div class="selection-options">${optionsHtml}</div>`;
      } else if (isMultiSelection && template!.options!.length > 0) {
        optionsHtml = template!.options!
          .map(
            (opt, oi) => {
              const sel = multiIndices.includes(oi);
              return `<div class="option-row"><span class="option-num">${oi + 1}.</span>
  <span class="option-radio ${sel ? 'selected' : ''}">${sel ? '✓' : '○'}</span>
  <span class="option-label">${escapeHtml(opt || t('optionLabel', { num: oi + 1 }))}</span></div>`;
            }
          )
          .join('');
        optionsHtml = `<div class="selection-options">${optionsHtml}</div>`;
      }

      return `
    <tr>
      <td class="col-num">${index}.</td>
      <td class="col-status ${statusClass}">${statusText}</td>
      <td class="col-content">
        <div class="item-title">${escapeHtml(title || '(제목 없음)')}</div>
        ${optionsHtml}
      </td>
    </tr>`;
    })
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; color: #1a1a1a; font-size: 14px; }
    .report-header { border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 20px; }
    .report-date { font-size: 12px; color: #64748b; margin-bottom: 4px; }
    .report-title { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
    .report-category { font-size: 13px; color: #64748b; margin-bottom: 8px; }
    .report-note { font-size: 13px; color: #475569; line-height: 1.5; }
    .section-title { font-size: 15px; font-weight: 600; margin: 20px 0 12px; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; }
    tr { border-bottom: 1px solid #e2e8f0; }
    td { padding: 12px 8px; vertical-align: top; }
    .col-num { width: 32px; color: #64748b; font-size: 14px; }
    .col-status { width: 72px; font-weight: 600; font-size: 13px; }
    .status-done { color: #2563eb; }
    .status-pending { color: #94a3b8; }
    .col-content { }
    .item-title { font-size: 15px; color: #0f172a; }
    .selection-options { margin-top: 8px; padding-left: 4px; }
    .option-row { display: flex; align-items: center; margin-bottom: 4px; font-size: 13px; }
    .option-num { width: 24px; color: #94a3b8; }
    .option-radio { margin-right: 8px; font-size: 12px; }
    .option-radio.selected { color: #2563eb; }
    .option-label { color: #475569; }
    .footer { margin-top: 24px; font-size: 11px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="report-header">
    <div class="report-date">${date}</div>
    <div class="report-title">${subject}</div>
    <div class="report-category">${groupName}</div>
    ${note ? `<div class="report-note">${note}</div>` : ''}
  </div>
  <div class="section-title">${t('checkItems')}</div>
  <table>
    ${rows}
  </table>
  <div class="footer">ThinkLess · 기록 리포트</div>
</body>
</html>`;
}
