import React, { useState, useEffect, useRef } from "react";

const VirtualDomTable: React.FC = () => {
  const tableCols = Array.from({ length: 30 }, (_, i) => i + 1);
  const tableData = Array.from({ length: 1000 }, (_, i) => i + 1);

  // 虚拟滚动相关状态
  const [visibleRows, setVisibleRows] = useState<
    { index: number; data: number }[]
  >([]);
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const fixedHeaderRef = useRef<HTMLTableSectionElement>(null);

  // 行高和表头高度
  const rowHeight = 37; // 每行高度(像素)
  const bufferRowCount = 10; // 缓冲区行数
  const [headerHeight, setHeaderHeight] = useState(0); // 表头高度

  // 计算表头高度
  useEffect(() => {
    if (fixedHeaderRef.current) {
      const height = fixedHeaderRef.current.offsetHeight;
      setHeaderHeight(height);
    }
  }, []);

  // 计算可见行
  useEffect(() => {
    if (!containerRef.current) return;

    const containerHeight = containerRef.current.clientHeight;
    if (containerHeight <= 0) return;

    // 计算可见行数
    const visibleRowCount = Math.ceil(containerHeight / rowHeight);

    // 计算开始和结束索引
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / rowHeight) - bufferRowCount
    );
    const endIndex = Math.min(
      tableData.length - 1,
      startIndex + visibleRowCount + bufferRowCount * 2
    );

    // 生成可见行数据
    const newVisibleRows = [];
    for (let i = startIndex; i <= endIndex; i++) {
      newVisibleRows.push({
        index: i,
        data: tableData[i],
      });
    }

    setVisibleRows(newVisibleRows);
  }, [scrollTop, headerHeight]);

  // 处理滚动事件
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget?.scrollTop || 0);
  };

  return (
    <div style={styles.container}>
      <div style={styles.tableWrapper}>
        <div 
          ref={containerRef}
          style={styles.scrollContainer}
          onScroll={handleScroll}
        >
          <div style={{ ...styles.tableContainer, height: headerHeight + tableData.length * rowHeight }}>
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
                {visibleRows.map(({ index, data: row }) => (
                  <tr
                    key={row}
                    style={{
                      ...styles.tr,
                      ...(index % 2 === 0 ? styles.evenRow : styles.oddRow),
                      position: "absolute",
                      top: headerHeight + index * rowHeight, // 加上表头高度
                      width: "100%",
                    }}
                  >
                    {tableCols.map((col) => (
                      <td key={col} style={styles.td}>
                        Row {row}, Column {col}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* 固定表头覆盖层 */}
        <table style={{ ...styles.table, ...styles.fixedHeaderTable }}>
          <thead ref={fixedHeaderRef} style={styles.thead}>
            <tr>
              {tableCols.map((col) => (
                <th key={col} style={styles.th}>
                  Column {col}
                </th>
              ))}
            </tr>
          </thead>
        </table>
      </div>
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
    height: "calc(100vh - 180px)",
    maxHeight: "calc(100vh - 180px)",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    position: "relative",
    overflow: "hidden",
  },
  scrollContainer: {
    height: "100%",
    overflow: "auto",
  },
  tableContainer: {
    position: "relative",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: "white",
  },
  fixedHeaderTable: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: "white",
  },
  thead: {
    backgroundColor: "white",
  },
  th: {
    backgroundColor: "#4a90e2",
    color: "white",
    fontWeight: 600,
    padding: "12px 15px",
    textAlign: "left",
    fontSize: "14px",
    position: "relative",
    minWidth: "160px",
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
  td: {
    padding: "10px 15px",
    borderBottom: "1px solid #eee",
    fontSize: "13px",
    color: "#333",
    whiteSpace: "nowrap",
    minWidth: "160px",
  },
};

export default VirtualDomTable;