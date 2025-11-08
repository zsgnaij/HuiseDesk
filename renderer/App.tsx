import React from 'react';
import ChatBox from '@components/ChatBox';

/**
 * 主应用组件
 */
const App: React.FC = () => {
  return (
    <div style={styles.app}>
      <ChatBox />
    </div>
  );
};

/**
 * 样式定义
 */
const styles: { [key: string]: React.CSSProperties } = {
  app: {
    width: '100%',
    height: '100vh',
    margin: 0,
    padding: 0,
    overflow: 'hidden',
  },
};

export default App;
