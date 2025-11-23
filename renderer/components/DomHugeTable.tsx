import React from "react";

const DomHugeTable: React.FC = () => {
  const tableCols = Array.from({ length: 30 }, (_, i) => i + 1);
  const tableData = Array.from({ length: 1000 }, (_, i) => i + 1);
  
  // 创建一个带悬停效果的自定义行组件
  const TableRow: React.FC<{ 
    row: number; 
    rowIndex: number;
    children: React.ReactNode 
  }> = ({ row, rowIndex, children }) => {
    const [isHovered, setIsHovered] = React.useState(false);
    
    return (
      <tr 
        key={row} 
        style={{
          ...styles.tr,
          ...(rowIndex % 2 === 0 ? styles.evenRow : styles.oddRow),
          ...(isHovered ? styles.hoveredRow : {}),
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {children}
      </tr>
    );
  };

  return (
    <div style={styles.container}>
      <div className="huge-table-wrapper" style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead style={styles.thead}>
            <tr>
              {tableCols.map((col) => (
                <th key={col} style={styles.th}>
                  Column {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, rowIndex) => (
              <TableRow row={row} rowIndex={rowIndex} key={row}>
                {tableCols.map((col) => (
                  <td key={col} style={styles.td}>
                    Row {row}, Column {col}
                  </td>
                ))}
              </TableRow>
            ))}
          </tbody>
        </table>
      </div>
      <style>{`
        .huge-table-wrapper::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        .huge-table-wrapper::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        .huge-table-wrapper::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }
        
        .huge-table-wrapper::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    height: "100%",
    padding: "20px",
    backgroundColor: "#f8f9fa",
    position: "relative",
  },
  tableWrapper: {
    height: "100%",
    overflow: "auto",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: "white",
  },
  thead: {
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  th: {
    backgroundColor: "#4a90e2",
    color: "white",
    fontWeight: 600,
    padding: "12px 15px",
    textAlign: "left",
    fontSize: "14px",
    position: "relative",
  },
  tr: {
    transition: "background-color 0.2s ease",
  },
  evenRow: {
    backgroundColor: "#f8f9fa",
  },
  oddRow: {
    backgroundColor: "white",
  },
  hoveredRow: {
    backgroundColor: "#e3f2fd",
  },
  td: {
    padding: "10px 15px",
    borderBottom: "1px solid #eee",
    fontSize: "13px",
    color: "#333",
    whiteSpace: "nowrap",
  },
};

export default DomHugeTable;