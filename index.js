/**
 * @format
 */

import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// react-native-screens 네이티브 최적화 (React Navigation 사용 시 권장)
enableScreens();

AppRegistry.registerComponent(appName, () => App);
