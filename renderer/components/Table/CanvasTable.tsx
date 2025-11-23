import React, { useRef, useEffect, useState } from "react";

const CanvasTable: React.FC = () => {
  const contentCanvasRef = useRef<HTMLCanvasElement>(null);
  const headerCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });

  // 数据生成
  const tableCols = Array.from({ length: 30 }, (_, i) => i + 1);
  const tableData = Array.from({ length: 1000 }, (_, i) => i + 1);

  // 表格样式配置 - 同步DomTable样式
  const config = {
    cellWidth: 160, // 同步DomTable的minWidth
    cellHeight: 37, // 同步DomTable的行高
    headerHeight: 44, // 表头高度
    headerBgColor: "#4a90e2", // 同步DomTable表头背景色
    headerTextColor: "#ffffff", // 同步DomTable表头文字颜色
    evenRowBgColor: "#f8f9fa", // 同步DomTable偶数行背景色
    oddRowBgColor: "#ffffff", // 同步DomTable奇数行背景色
    cellBorderColor: "#eee", // 同步DomTable边框颜色
    textColor: "#333", // 同步DomTable文字颜色
    fontSize: 13, // 同步DomTable字体大小
    headerFontSize: 14, // 同步DomTable表头字体大小
  };

  // 处理滚动事件
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setScrollPosition({
      x: target.scrollLeft,
      y: target.scrollTop,
    });
    
    // 滚动时重绘canvas
    redrawCanvases();
  };

  // 重绘所有canvas
  const redrawCanvases = () => {
    const contentCanvas = contentCanvasRef.current;
    const headerCanvas = headerCanvasRef.current;
    const container = containerRef.current;
    
    if (!contentCanvas || !headerCanvas || !container) return;

    const contentCtx = contentCanvas.getContext("2d");
    const headerCtx = headerCanvas.getContext("2d");
    if (!contentCtx || !headerCtx) return;

    // 计算总尺寸
    const totalWidth = tableCols.length * config.cellWidth;
    const totalHeight =
      config.headerHeight + tableData.length * config.cellHeight;

    // 重绘内容canvas
    drawContent(contentCtx, totalWidth, totalHeight);
    
    // 重绘表头canvas
    drawHeader(headerCtx, totalWidth);
  };

  // 监听容器尺寸变化
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      redrawCanvases();
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // 初始化绘制
  useEffect(() => {
    const contentCanvas = contentCanvasRef.current;
    const headerCanvas = headerCanvasRef.current;
    const container = containerRef.current;
    if (!contentCanvas || !headerCanvas || !container) return;

    const contentCtx = contentCanvas.getContext("2d");
    const headerCtx = headerCanvas.getContext("2d");
    if (!contentCtx || !headerCtx) return;

    // 计算总尺寸
    const totalWidth = tableCols.length * config.cellWidth;
    const totalHeight =
      config.headerHeight + tableData.length * config.cellHeight;

    // 设置canvas尺寸
    const dpr = window.devicePixelRatio || 1;
    
    // 设置内容canvas尺寸
    contentCanvas.width = totalWidth * dpr;
    contentCanvas.height = totalHeight * dpr;
    contentCanvas.style.width = `${totalWidth}px`;
    contentCanvas.style.height = `${totalHeight}px`;
    
    // 设置表头canvas尺寸
    headerCanvas.width = totalWidth * dpr;
    headerCanvas.height = config.headerHeight * dpr;
    headerCanvas.style.width = `${totalWidth}px`;
    headerCanvas.style.height = `${config.headerHeight}px`;
    
    // 设置缩放
    contentCtx.scale(dpr, dpr);
    headerCtx.scale(dpr, dpr);

    // 绘制内容
    drawContent(contentCtx, totalWidth, totalHeight);
    
    // 绘制表头
    drawHeader(headerCtx, totalWidth);
  }, []);

  const drawContent = (
    ctx: CanvasRenderingContext2D,
    totalWidth: number,
    totalHeight: number
  ) => {
    // 清空画布
    ctx.clearRect(0, 0, totalWidth, totalHeight);

    // 绘制所有数据行
    for (let row = 0; row < tableData.length; row++) {
      const y = config.headerHeight + row * config.cellHeight - scrollPosition.y;

      // 绘制行背景
      ctx.fillStyle =
        row % 2 === 0 ? config.evenRowBgColor : config.oddRowBgColor;
      ctx.fillRect(0, y, totalWidth, config.cellHeight);

      // 绘制单元格内容和边框
      for (let col = 0; col < tableCols.length; col++) {
        const x = col * config.cellWidth - scrollPosition.x;

        // 绘制单元格文字 - 同步DomTable内容格式
        ctx.fillStyle = config.textColor;
        ctx.font = `${config.fontSize}px Arial`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(
          `Row ${tableData[row]}, Column ${tableCols[col]}`,
          x + 15,
          y + config.cellHeight / 2
        );

        // 绘制右边框
        ctx.strokeStyle = config.cellBorderColor;
        ctx.beginPath();
        ctx.moveTo(x + config.cellWidth, y);
        ctx.lineTo(x + config.cellWidth, y + config.cellHeight);
        ctx.stroke();
      }

      // 绘制底边框
      ctx.strokeStyle = config.cellBorderColor;
      ctx.beginPath();
      ctx.moveTo(0, y + config.cellHeight);
      ctx.lineTo(totalWidth, y + config.cellHeight);
      ctx.stroke();
    }
  };

  const drawHeader = (
    ctx: CanvasRenderingContext2D,
    totalWidth: number
  ) => {
    // 清空画布
    ctx.clearRect(0, 0, totalWidth, config.headerHeight);
    
    // 绘制表头背景
    ctx.fillStyle = config.headerBgColor;
    ctx.fillRect(0, 0, totalWidth, config.headerHeight);

    // 绘制表头文字和边框
    ctx.fillStyle = config.headerTextColor;
    ctx.font = `bold ${config.headerFontSize}px Arial`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    for (let i = 0; i < tableCols.length; i++) {
      const x = i * config.cellWidth - scrollPosition.x;

      // 绘制表头文字 - 同步DomTable内容格式
      ctx.fillText(`Column ${tableCols[i]}`, x + 15, config.headerHeight / 2);

      // 绘制右边框
      ctx.strokeStyle = config.cellBorderColor;
      ctx.beginPath();
      ctx.moveTo(x + config.cellWidth, 0);
      ctx.lineTo(x + config.cellWidth, config.headerHeight);
      ctx.stroke();
    }

    // 绘制底边框
    ctx.beginPath();
    ctx.moveTo(0, config.headerHeight);
    ctx.lineTo(totalWidth, config.headerHeight);
    ctx.stroke();
  };

  return (
    <div
      style={{ height: "100%", padding: "20px", backgroundColor: "#f8f9fa" }}
    >
      <div
        ref={containerRef}
        style={{
          height: "calc(100vh - 180px)",
          maxHeight: "calc(100vh - 180px)",
          overflow: "auto",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          backgroundColor: "white",
          position: "relative",
        }}
        onScroll={handleScroll}
      >
        <div
          style={{
            width: `${tableCols.length * config.cellWidth}px`,
            height: `${
              config.headerHeight + tableData.length * config.cellHeight
            }px`,
            position: "absolute",
            top: 0,
            left: 0,
          }}
        />
        {/* 表头canvas - 固定在顶部 */}
        <canvas
          ref={headerCanvasRef}
          style={{
            display: "block",
            position: "sticky",
            top: 0,
            left: 0,
            zIndex: 10,
          }}
        />
        {/* 内容canvas */}
        <canvas
          ref={contentCanvasRef}
          style={{
            display: "block",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        />
      </div>
      <style>{`
        div::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        div::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        div::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }
        
        div::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </div>
  );
};

export default CanvasTable;