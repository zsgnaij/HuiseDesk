import React, { useState, useEffect, useRef } from "react";

const VirtualDomHugaTable: React.FC = () => {
  const tableCols = Array.from({ length: 30 }, (_, i) => i + 1);
  const tableData = Array.from({ length: 1000 }, (_, i) => i + 1);
  
  // 虚拟滚动相关状态
  const [visibleRows, setVisibleRows] = useState<{ index: number; data: number }[]>([]);
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 行高
  const rowHeight = 37; // 每行高度(像素)
  const bufferRowCount = 5; // 缓冲区行数
  
  // 计算可见行
  useEffect(() => {
    if (!containerRef.current) return;
    
    const containerHeight = containerRef.current.clientHeight;
    if (containerHeight <= 0) return;
    
    // 计算可见行数
    const visibleRowCount = Math.ceil(containerHeight / rowHeight);
    
    // 计算开始和结束索引
    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - bufferRowCount);
    const endIndex = Math.min(
      tableData.length - 1,
      startIndex + visibleRowCount + bufferRowCount * 2
    );
    
    // 生成可见行数据
    const newVisibleRows = [];
    for (let i = startIndex; i <= endIndex; i++) {
      newVisibleRows.push({
        index: i,
        data: tableData[i]
      });
    }
    
    setVisibleRows(newVisibleRows);
  }, [scrollTop]);
  
  // 处理滚动事件
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div style={{ height: "100%", padding: "20px", backgroundColor: "#f8f9fa" }}>
      <div 
        ref={containerRef}
        style={{ 
          height: "100%", 
          overflow: "auto",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
        }}
        onScroll={handleScroll}
      >
        <div style={{ height: tableData.length * rowHeight, position: "relative" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            backgroundColor: "white",
            minWidth: "100%",
            tableLayout: "fixed"
          }}>
            <thead style={{
              position: "sticky",
              top: 0,
              zIndex: 10,
              backgroundColor: "white"
            }}>
              <tr>
                {tableCols.map((col) => (
                  <th key={col} style={{
                    backgroundColor: "#4a90e2",
                    color: "white",
                    fontWeight: 600,
                    padding: "12px 15px",
                    textAlign: "left",
                    fontSize: "14px",
                    position: "relative",
                    whiteSpace: "nowrap"
                  }}>
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
                    backgroundColor: index % 2 === 0 ? "#f8f9fa" : "white",
                    transition: "background-color 0.2s ease",
                    position: "absolute",
                    top: index * rowHeight,
                    width: "100%"
                  }}
                >
                  {tableCols.map((col) => (
                    <td key={col} style={{
                      padding: "10px 15px",
                      borderBottom: "1px solid #eee",
                      fontSize: "13px",
                      color: "#333",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}>
                      Row {row}, Column {col}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`
        div[ref]::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        div[ref]::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        div[ref]::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }
        
        div[ref]::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </div>
  );
};

export default VirtualDomHugaTable;