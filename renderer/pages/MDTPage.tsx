import React, { useState } from "react";
import { Link } from "react-router-dom";
import DomHugeTable from "../components/DomHugeTable";

const MDTPage: React.FC = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);

  return (
    <div style={styles.container}>
      <main style={styles.main}>
        <div style={styles.header}>
          <h3>大数据表格展示</h3>
          <p>展示一个包含1000行30列数据的表格组件</p>
        </div>
        <DomHugeTable />
      </main>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  main: {
    flex: 1,
    overflow: "hidden",
    padding: "20px",
  },
  header: {
    marginBottom: "20px",
  }
};

export default MDTPage;