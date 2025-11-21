import React from 'react';
import { Link } from 'react-router-dom';

/**
 * 首页组件
 */
const HomePage: React.FC = () => {

  return (
    <div style={styles.container}>
      {/* 主内容区 */}
      <main style={styles.main}>
        <div style={styles.content}>
          <h1 style={styles.title}>欢迎使用 HuiseDesk</h1>
          <p style={styles.description}>这是一个基于 React 的桌面应用</p>
          <div style={styles.linkContainer}>
            <Link to="/chat" style={styles.link}>进入聊天页面</Link>
            <Link to="/shotgrid" style={styles.link}>ShotGrid</Link>
          </div>
        </div>
      </main>
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
    height: '100%',
  },
  floatingNav: {
    position: 'fixed',
    top: '15px',
    left: '15px',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'row',
  },
  navButton: {
    width: '40px',
    height: '40px',
    borderRadius: '20px',
    backgroundColor: '#4a90e2',
    color: 'white',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
  },
  navMenu: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: '20px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
    marginLeft: '8px',
    transition: 'all 0.3s ease',
  },
  navHeader: {
    padding: '0 12px',
    borderRight: '1px solid #e9ecef',
  },
  navTitle: {
    fontWeight: 'bold',
    color: '#4a90e2',
    fontSize: '14px',
  },
  navLinks: {
    display: 'flex',
    flexDirection: 'row',
  },
  navLink: {
    padding: '0 12px',
    textDecoration: 'none',
    color: '#333',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    transition: 'background-color 0.2s',
    fontSize: '14px',
  },
  navLinkActive: {
    padding: '0 12px',
    textDecoration: 'none',
    color: '#4a90e2',
    fontWeight: 'bold',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    fontSize: '14px',
  },
  main: {
    flex: 1,
    overflow: 'auto',
  },
  content: {
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
  linkContainer: {
    display: 'flex',
    gap: '1rem',
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