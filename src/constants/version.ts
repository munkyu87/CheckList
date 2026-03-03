/**
 * 앱 버전 (package.json과 동기화, 스토어·심사 시 참고)
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pkg = require('../../package.json') as { version?: string };
export const APP_VERSION = pkg?.version ?? '0.0.1';
