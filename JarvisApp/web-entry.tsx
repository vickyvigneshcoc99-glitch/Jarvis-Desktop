import { AppRegistry } from 'react-native';
import App from './App';

const appName = 'JarvisApp';

AppRegistry.registerComponent(appName, () => App);
AppRegistry.runApplication(appName, {
  initialProps: {},
  rootTag: document.getElementById('root'),
});

// Inject styles for react-native-web
const style = document.createElement('style');
style.textContent = `
  html, body, #root {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
  }
`;
document.head.appendChild(style);
