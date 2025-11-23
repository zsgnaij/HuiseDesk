import React, { useState } from "react";
import DomTable from "../components/Table/DomTable";
import VirtualDomTable from "../components/Table/VirtualDomTable";
import CanvasTable from "../components/Table/CanvasTable";
import VirtualCanvasTable from "../components/Table/VirtualCanvasTable";

const MDTPage: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<
    "normal" | "virtual" | "canvas" | "virtualCanvas"
  >("normal");

  const renderTable = () => {
    if (selectedTable === "normal") {
      return <DomTable />;
    } else if (selectedTable === "virtual") {
      return <VirtualDomTable />;
    } else if (selectedTable === "canvas") {
      return <CanvasTable />;
    } else if (selectedTable === "virtualCanvas") {
      return <VirtualCanvasTable />;
    }
    return null;
  };

  return (
    <div style={styles.container}>
      <main style={styles.main}>
        <div style={styles.header}>
          <h3>大数据表格展示</h3>
          <p>展示一个包含1000行30列数据的表格组件</p>
        </div>

        {/* 表格切换选项 */}
        <div style={styles.selectorContainer}>
          <div style={styles.selector}>
            <label style={styles.label}>
              <input
                type="radio"
                value="normal"
                checked={selectedTable === "normal"}
                onChange={() => setSelectedTable("normal")}
                style={styles.radio}
              />
              普通表格
            </label>
            <label style={styles.label}>
              <input
                type="radio"
                value="virtual"
                checked={selectedTable === "virtual"}
                onChange={() => setSelectedTable("virtual")}
                style={styles.radio}
              />
              虚拟滚动表格
            </label>
            <label style={styles.label}>
              <input
                type="radio"
                value="canvas"
                checked={selectedTable === "canvas"}
                onChange={() => setSelectedTable("canvas")}
                style={styles.radio}
              />
              Canvas表格
            </label>
            <label style={styles.label}>
              <input
                type="radio"
                value="virtualCanvas"
                checked={selectedTable === "virtualCanvas"}
                onChange={() => setSelectedTable("virtualCanvas")}
                style={styles.radio}
              />
              Canvas虚拟滚动表格
            </label>
          </div>
        </div>

        {/* 根据选择显示相应的表格 */}
        <div style={styles.tableContainer}>{renderTable()}</div>
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
  },
  selectorContainer: {
    marginBottom: "20px",
  },
  selector: {
    display: "flex",
    gap: "20px",
    padding: "10px",
    backgroundColor: "#f5f5f5",
    borderRadius: "4px",
  },
  label: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    cursor: "pointer",
    fontSize: "14px",
  },
  radio: {
    cursor: "pointer",
  },
  tableContainer: {
    flex: 1,
    overflow: "auto",
    height: "calc(100% - 120px)",
  },
};

export default MDTPage;
