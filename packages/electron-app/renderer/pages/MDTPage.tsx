import React from "react";
import MultiDimensionalTable from "../components/MultiDimensionalTable";

const MDTPage: React.FC = () => {
  return (
    <div style={styles.container}>
      <main style={styles.main}>
        <div style={styles.tableContainer}>{<MultiDimensionalTable />}</div>
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
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
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
    overflow: "hidden",
    height: "calc(100% - 120px)",
  },
  // Markdown样式
  markdownContainer: {
    fontSize: "14px",
    lineHeight: "1.6",
    color: "#333",
    padding: "16px",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
};

export default MDTPage;
