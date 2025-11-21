import React from 'react';
import { Link } from 'react-router-dom';

/**
 * 首页组件
 */
const HomePage: React.FC = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>欢迎使用 HuiseDesk</h1>
      <p style={styles.description}>这是一个基于 React 的桌面应用</p>
      <Link to="/chat" style={styles.link}>进入聊天页面</Link>
    </div>
  );
};

/**
 * 样式定义
 */
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '2rem',
    textAlign: 'center',
  },
  title: {
    fontSize: '2.5rem',
    marginBottom: '1rem',
    color: '#333',
  },
  description: {
    fontSize: '1.2rem',
    marginBottom: '2rem',
    color: '#666',
  },
  link: {
    padding: '0.8rem 1.5rem',
    fontSize: '1rem',
    backgroundColor: '#4a90e2',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
    transition: 'background-color 0.3s',
  },
};

export default HomePage;