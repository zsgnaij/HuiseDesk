import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ShotGridUploader from '@components/ShotGridUploader';

/**
 * ShotGrid 页面组件
 */
const ShotGridPage: React.FC = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);

  return (
    <div style={styles.container}>
      {/* 浮动导航图标 */}
      <div 
        style={styles.floatingNav}
        onMouseEnter={() => setIsNavOpen(true)}
      >
        <button 
          style={styles.navButton}
          onClick={() => setIsNavOpen(!isNavOpen)}
        >
          ☰
        </button>
        
        {/* 展开的导航菜单 */}
        {isNavOpen && (
          <div 
            style={styles.navMenu}
            onMouseLeave={() => setIsNavOpen(false)}
          >
            <div style={styles.navHeader}>
              <span style={styles.navTitle}>HuiseDesk</span>
            </div>
            <nav style={styles.navLinks}>
              <Link to="/" style={styles.navLink}>首页</Link>
              <Link to="/chat" style={styles.navLink}>聊天</Link>
              <Link to="/shotgrid" style={styles.navLinkActive}>ShotGrid</Link>
            </nav>
          </div>
        )}
      </div>
      
      {/* 主内容区 */}
      <main style={styles.main}>
        <ShotGridUploader />
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
    padding: '20px',
  },
};

export default ShotGridPage;