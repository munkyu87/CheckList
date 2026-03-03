/**
 * 네비게이션 파라미터 타입
 */

export type HomeStackParamList = {
  Home: undefined;
  RecordDetail: { recordId: string };
  EditRecord: { recordId: string };
};

export type GroupsStackParamList = {
  GroupList: undefined;
  GroupDetail: { groupId: string };
};

export type NewRecordStackParamList = {
  NewRecord: undefined;
};

export type SettingsStackParamList = {
  Settings: undefined;
};

export type RootTabParamList = {
  HomeTab: undefined;
  NewRecord: undefined;
  GroupsTab: undefined;
  SettingsTab: undefined;
};
