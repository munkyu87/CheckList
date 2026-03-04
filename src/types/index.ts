/**
 * 앱 전역 타입 (APP_SPEC 기반)
 */

export interface ChecklistGroup {
  id: string;
  name: string;
  /** UI에 표시할 대상 이름 라벨. 예: "경로당명", "매장명". 비우면 "대상 이름" */
  subjectLabel: string;
  createdAt: string; // ISO string
}

/** 항목 유형: 일반 체크(✓) 또는 선택형(보기 2~5개 중 하나) */
export type ChecklistItemType = 'check' | 'selection';

export interface ChecklistItemTemplate {
  id: string;
  groupId: string;
  title: string;
  order: number;
  /** 기본 'check'. 'selection'이면 options 사용 (2~5개) */
  itemType?: ChecklistItemType;
  /** 선택형일 때 보기 문자열 배열. 2~5개 */
  options?: string[];
}

export interface ChecklistRecord {
  id: string;
  date: string; // YYYY-MM-DD
  subjectName: string;
  /** 그룹 없이 커스텀만 쓰면 없음 */
  groupId?: string;
  createdAt: string; // ISO string
  overallNote?: string;
  /** 즐겨찾기 여부 */
  isFavorite?: boolean;
}

export interface RecordItem {
  id: string;
  recordId: string;
  /** 템플릿 항목일 때 */
  templateItemId?: string;
  /** 커스텀 항목일 때 (그룹 없이 또는 그룹+추가 항목) */
  customTitle?: string;
  /** 표시 순서 (템플릿 순서 + 커스텀 순서) */
  order?: number;
  checked: boolean;
  /** 선택형 항목일 때 선택한 보기 인덱스 (0부터). 있으면 checked는 true로 간주 */
  selectedOptionIndex?: number;
}
