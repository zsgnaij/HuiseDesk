import React, { useRef, useEffect, useState } from "react";

const CanvasTable: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });

  // 数据生成
  const tableCols = Array.from({ length: 30 }, (_, i) => i + 1);
  const tableData = Array.from({ length: 1000 }, (_, i) => i + 1);

  // 表格样式配置
  const config = {
    cellWidth: 160,
    cellHeight: 37,
    headerHeight: 40,
    headerBgColor: "#4a90e2",
    headerTextColor: "#ffffff",
    evenRowBgColor: "#f8f9fa",
    oddRowBgColor: "#ffffff",
    cellBorderColor: "#eee",
    textColor: "#333",
    fontSize: 12,
    headerFontSize: 14,
  };

  // 处理滚动事件
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setScrollPosition({
      x: target.scrollLeft,
      y: target.scrollTop,
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 设置canvas尺寸
    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = container.clientHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // 绘制表格
    drawTable(ctx, width, height);
  }, [scrollPosition]);

  const drawTable = (
    ctx: CanvasRenderingContext2D,
    containerWidth: number,
    containerHeight: number
  ) => {
    // 清空画布
    ctx.clearRect(0, 0, containerWidth, containerHeight);

    // 计算可见区域
    const totalWidth = tableCols.length * config.cellWidth;
    const totalHeight =
      config.headerHeight + tableData.length * config.cellHeight;

    // 绘制表头
    drawHeader(ctx, containerWidth);

    // 绘制数据行
    drawRows(ctx, containerWidth, containerHeight);
  };

  const drawHeader = (
    ctx: CanvasRenderingContext2D,
    containerWidth: number
  ) => {
    // 绘制表头背景
    ctx.fillStyle = config.headerBgColor;
    ctx.fillRect(0, 0, containerWidth, config.headerHeight);

    // 绘制表头文字和边框
    ctx.fillStyle = config.headerTextColor;
    ctx.font = `bold ${config.headerFontSize}px Arial`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    for (let i = 0; i < tableCols.length; i++) {
      const x = i * config.cellWidth - scrollPosition.x;

      // 跳过不可见的列
      if (x + config.cellWidth < 0 || x > containerWidth) continue;

      // 绘制表头文字
      ctx.fillText(`Column ${tableCols[i]}`, x + 10, config.headerHeight / 2);

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
    ctx.lineTo(containerWidth, config.headerHeight);
    ctx.stroke();
  };

  const drawRows = (
    ctx: CanvasRenderingContext2D,
    containerWidth: number,
    containerHeight: number
  ) => {
    ctx.font = `${config.fontSize}px Arial`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    // 计算可见行范围
    const startRow = Math.max(
      0,
      Math.floor(scrollPosition.y / config.cellHeight)
    );
    const endRow = Math.min(
      tableData.length,
      startRow + Math.ceil(containerHeight / config.cellHeight) + 1
    );

    for (let row = startRow; row < endRow; row++) {
      const y =
        config.headerHeight + row * config.cellHeight - scrollPosition.y;

      // 如果超出可视区域则跳过
      if (y + config.cellHeight < config.headerHeight || y > containerHeight)
        continue;

      // 绘制行背景
      ctx.fillStyle =
        row % 2 === 0 ? config.evenRowBgColor : config.oddRowBgColor;
      ctx.fillRect(0, y, containerWidth, config.cellHeight);

      // 绘制单元格内容和边框
      for (let col = 0; col < tableCols.length; col++) {
        const x = col * config.cellWidth - scrollPosition.x;

        // 跳过不可见的列
        if (x + config.cellWidth < 0 || x > containerWidth) continue;

        // 绘制单元格文字
        ctx.fillStyle = config.textColor;
        ctx.fillText(
          `Row ${tableData[row]}, Col ${tableCols[col]}`,
          x + 10,
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
      ctx.lineTo(containerWidth, y + config.cellHeight);
      ctx.stroke();
    }
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
        }}
        onScroll={handleScroll}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: "block",
            width: `${tableCols.length * config.cellWidth}px`,
            height: `${
              config.headerHeight + tableData.length * config.cellHeight
            }px`,
          }}
        />
      </div>
    </div>
  );
};

export default CanvasTable;
