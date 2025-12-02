import React, { useRef, useEffect, useState, useCallback } from "react";

// 单元格位置
interface CellPosition {
  row: number;
  col: number;
}

// 单元格数据存储结构
interface CellData {
  [key: string]: string;
}

const MultiDimensionalTable: React.FC = () => {
  // 初始行列数
  const initialRows = 5;
  const initialCols = 5;
  
  // Canvas和容器引用
  const contentRef = useRef<HTMLCanvasElement | null>(null);
  const headerRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // 滚动位置和视口尺寸
  const scrollRef = useRef({ x: 0, y: 0 });
  const viewportRef = useRef({ width: 0, height: 0 });
  
  // 动画帧和鼠标位置
  const rafRef = useRef<number | null>(null);
  const mousePositionRef = useRef({ x: -1, y: -1 });

  // 编辑状态
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null);
  const [editValue, setEditValue] = useState("");
  const editingCellRef = useRef<HTMLDivElement | null>(null);

  // 行列数据
  const [cols, setCols] = useState<number[]>(
    Array.from({ length: initialCols }, (_, i) => i + 1)
  );
  const [rows, setRows] = useState<number[]>(
    Array.from({ length: initialRows }, (_, i) => i + 1)
  );

  // 单元格数据存储
  const cellDataRef = useRef<CellData>({});

  // 表格配置
  const config = {
    cellWidth: 160,
    cellHeight: 37,
    headerHeight: 44,
    headerBg: "#ffffff",
    headerColor: "#333",
    evenBg: "#ffffff",
    oddBg: "#ffffff",
    borderColor: "#ddd",
    textColor: "#333",
    fontSize: 13,
    headerFontSize: 14,
    borderWidth: 1,
  };

  // 计算总尺寸（包含"+"号区域）
  const totalWidth = (cols.length + 1) * config.cellWidth;
  const totalHeight = (rows.length + 1) * config.cellHeight;

  // 获取单元格值
  const getCellValue = (row: number, col: number) => {
    const key = `${row}-${col}`;
    return cellDataRef.current[key] || "";
  };

  // 设置单元格值
  const setCellValue = (row: number, col: number, value: string) => {
    const key = `${row}-${col}`;
    cellDataRef.current[key] = value;
  };

  // 新增行
  const addRow = useCallback(() => {
    setRows((prev) => [...prev, prev.length + 1]);
  }, []);

  // 新增列
  const addCol = useCallback(() => {
    setCols((prev) => [...prev, prev.length + 1]);
  }, []);

  // 滚动事件处理
  const onScroll = () => {
    if (!containerRef.current) return;
    const { scrollLeft, scrollTop } = containerRef.current;
    scrollRef.current = { x: scrollLeft, y: scrollTop };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
  };

  // 表头点击事件（新增列）
  const handleHeaderClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!headerRef.current) return;

    const rect = headerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollRef.current.x;

    const col = Math.floor(x / config.cellWidth);

    if (col === cols.length) {
      addCol();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(draw);
    }
  };

  // 内容区域点击事件（编辑单元格或新增行）
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!contentRef.current || !containerRef.current) return;

    const rect = contentRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollRef.current.x;
    const y = e.clientY - rect.top + scrollRef.current.y;

    const col = Math.floor(x / config.cellWidth);
    const row = Math.floor(y / config.cellHeight);

    // 点击新增行按钮
    if (row === rows.length) {
      addRow();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(draw);
      return;
    }

    // 编辑单元格
    if (row >= 0 && row < rows.length && col >= 0 && col < cols.length) {
      setEditingCell({ row, col });
      setEditValue(getCellValue(row, col));
      const container = containerRef.current;
      
      // 确保编辑的单元格在视口内
      const cellTop = row * config.cellHeight;
      const cellBottom = cellTop + config.cellHeight;
      const cellLeft = col * config.cellWidth;
      const cellRight = cellLeft + config.cellWidth;
      if (cellTop < container.scrollTop) {
        container.scrollTop = cellTop;
      } else if (cellBottom > container.scrollTop + container.clientHeight) {
        container.scrollTop = cellBottom - container.clientHeight;
      }

      if (cellLeft < container.scrollLeft) {
        container.scrollLeft = cellLeft;
      } else if (cellRight > container.scrollLeft + container.clientWidth) {
        container.scrollLeft = cellRight - container.clientWidth;
      }
    }
  };

  // 表头鼠标移动事件（悬停效果和光标样式）
  const handleHeaderMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!headerRef.current) return;

    const rect = headerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollRef.current.x;
    mousePositionRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    const col = Math.floor(x / config.cellWidth);
    const isOnAddColPlus = col === cols.length;
    if (isOnAddColPlus) {
      headerRef.current.style.cursor = "pointer";
    } else {
      headerRef.current.style.cursor = "default";
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
  };

  // 内容区域鼠标移动事件（悬停效果和光标样式）
  const handleContentMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!contentRef.current) return;

    const rect = contentRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollRef.current.x;
    const y = e.clientY - rect.top + scrollRef.current.y;

    mousePositionRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    const col = Math.floor(x / config.cellWidth);
    const row = Math.floor(y / config.cellHeight);
    const isOnAddRowPlus = row === rows.length;
    if (isOnAddRowPlus) {
      contentRef.current.style.cursor = "pointer";
    } else {
      contentRef.current.style.cursor = "default";
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
  };

  // 完成编辑
  const handleEditComplete = () => {
    if (editingCell) {
      setCellValue(editingCell.row, editingCell.col, editValue);
      setEditingCell(null);
      setEditValue("");
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(draw);
    }
  };

  // 取消编辑
  const handleEditCancel = () => {
    setEditingCell(null);
    setEditValue("");
  };

  // 键盘事件处理
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleEditComplete();
    } else if (e.key === "Escape") {
      handleEditCancel();
    }
  };

  // 编辑框失焦处理
  const handleEditBlur = () => {
    setTimeout(() => {
      handleEditComplete();
    }, 100);
  };

  // 绘制表头
  const drawHeader = (ctx: CanvasRenderingContext2D) => {
    const { width: w } = viewportRef.current;
    const { x } = scrollRef.current;

    ctx.clearRect(0, 0, w, config.headerHeight);
    ctx.fillStyle = config.headerBg;
    ctx.fillRect(0, 0, w, config.headerHeight);

    // 计算可见列范围
    const bufferCols = 2;
    const startCol = Math.max(0, Math.floor(x / config.cellWidth) - bufferCols);
    const visibleCols = Math.ceil(w / config.cellWidth);
    const endCol = Math.min(
      cols.length,
      startCol + visibleCols + bufferCols * 2
    );

    // 绘制列分隔线
    ctx.beginPath();
    for (let c = startCol; c < endCol; c++) {
      const cx = c * config.cellWidth - x;
      ctx.moveTo(cx + config.cellWidth - 0.5, 0);
      ctx.lineTo(cx + config.cellWidth - 0.5, config.headerHeight);
    }
    
    // 绘制表头底部边框
    ctx.moveTo(0, config.headerHeight - 0.5);
    ctx.lineTo(w, config.headerHeight - 0.5);

    ctx.strokeStyle = config.borderColor;
    ctx.lineWidth = config.borderWidth;
    ctx.stroke();

    // 绘制列标题文字
    ctx.fillStyle = config.headerColor;
    ctx.font = `bold ${config.headerFontSize}px Arial`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";

    for (let c = startCol; c < endCol; c++) {
      const cx = c * config.cellWidth - x;
      ctx.fillText(`Column ${cols[c]}`, cx + 15, config.headerHeight / 2);
    }

    // 绘制新增列按钮
    const lastColX = cols.length * config.cellWidth - x;
    if (lastColX >= -config.cellWidth && lastColX < w) {
      const isHovered =
        mousePositionRef.current.x >= lastColX &&
        mousePositionRef.current.x < lastColX + config.cellWidth &&
        mousePositionRef.current.y >= 0 &&
        mousePositionRef.current.y < config.headerHeight;

      ctx.fillStyle = isHovered ? "#e8e8e8" : "#ffffff";
      ctx.fillRect(lastColX, 0, config.cellWidth, config.headerHeight);

      ctx.strokeStyle = config.borderColor;
      ctx.lineWidth = config.borderWidth;
      
      // 绘制右边框线
      ctx.beginPath();
      ctx.moveTo(lastColX + config.cellWidth - 0.5, 0);
      ctx.lineTo(lastColX + config.cellWidth - 0.5, config.headerHeight);
      ctx.stroke();
      
      // 绘制底部边框线
      ctx.beginPath();
      ctx.moveTo(lastColX, config.headerHeight - 0.5);
      ctx.lineTo(lastColX + config.cellWidth, config.headerHeight - 0.5);
      ctx.stroke();

      ctx.fillStyle = "#666";
      ctx.font = `bold ${config.headerFontSize + 4}px Arial`;
      ctx.textAlign = "center";
      ctx.fillText(
        "+",
        lastColX + config.cellWidth / 2,
        config.headerHeight / 2
      );
    }
  };

  // 绘制内容区域
  const drawContent = (ctx: CanvasRenderingContext2D) => {
    const { width: w, height: h } = viewportRef.current;
    const { x, y } = scrollRef.current;

    ctx.clearRect(0, 0, w, h);

    // 计算可见行列范围
    const bufferRows = 5;
    const bufferCols = 2;

    const startRow = Math.max(
      0,
      Math.floor(y / config.cellHeight) - bufferRows
    );
    const endRow = Math.min(
      rows.length,
      Math.ceil((y + h) / config.cellHeight) + bufferRows
    );

    const startCol = Math.max(0, Math.floor(x / config.cellWidth) - bufferCols);
    const endCol = Math.min(
      cols.length,
      Math.ceil((x + w) / config.cellWidth) + bufferCols
    );

    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.font = `${config.fontSize}px Arial`;
    
    // 绘制单元格背景和内容
    for (let r = startRow; r < endRow; r++) {
      const rowY = r * config.cellHeight - y;
      const bg = r % 2 === 0 ? config.evenBg : config.oddBg;
      ctx.fillStyle = bg;
      ctx.fillRect(0, rowY, w, config.cellHeight);

      for (let c = startCol; c < endCol; c++) {
        const colX = c * config.cellWidth - x;
        ctx.fillStyle = config.textColor;
        if (editingCell && editingCell.row === r && editingCell.col === c) {
          ctx.fillStyle = "#e3f2fd";
          ctx.fillRect(colX, rowY, config.cellWidth, config.cellHeight);
          ctx.fillStyle = config.textColor;
        }

        ctx.fillText(
          getCellValue(r, c),
          colX + 15,
          rowY + config.cellHeight / 2
        );
      }
    }
    
    // 计算表格实际尺寸
    const lastRowY = rows.length * config.cellHeight - y;
    const tableWidth = cols.length * config.cellWidth;
    const tableHeight = rows.length * config.cellHeight;
        
    // 绘制新增行按钮
    if (lastRowY >= -config.cellHeight && lastRowY < h) {
      const isHovered =
        mousePositionRef.current.x >= 0 &&
        mousePositionRef.current.x < tableWidth &&
        mousePositionRef.current.y >= lastRowY &&
        mousePositionRef.current.y < lastRowY + config.cellHeight;

      ctx.fillStyle = isHovered ? "#e8e8e8" : "#ffffff";
      ctx.fillRect(0, lastRowY, tableWidth, config.cellHeight);
      ctx.strokeStyle = config.borderColor;
      ctx.lineWidth = config.borderWidth;
      ctx.beginPath();
      ctx.moveTo(0.5, lastRowY);
      ctx.lineTo(0.5, lastRowY + config.cellHeight);
      ctx.stroke();
      const rightX = Math.min(tableWidth, w) - 0.5;
      ctx.beginPath();
      ctx.moveTo(rightX, lastRowY);
      ctx.lineTo(rightX, lastRowY + config.cellHeight);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, lastRowY - 0.5);
      ctx.lineTo(w, lastRowY - 0.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, lastRowY + config.cellHeight - 0.5);
      ctx.lineTo(w, lastRowY + config.cellHeight - 0.5);
      ctx.stroke();

      ctx.fillStyle = "#666";
      ctx.font = `bold ${config.fontSize + 4}px Arial`;
      ctx.textAlign = "center";
      ctx.fillText("+", tableWidth / 2, lastRowY + config.cellHeight / 2);
    }

    // 绘制网格线
    ctx.beginPath();
    
    // 绘制垂直网格线
    for (let c = startCol; c <= endCol; c++) {
      const cx = c * config.cellWidth - x;
      if (cx >= -1 && cx <= tableWidth - x + 1) {
        const lineEndY = Math.min(h, tableHeight - y);
        ctx.moveTo(cx - 0.5, 0);
        ctx.lineTo(cx - 0.5, lineEndY);
      }
    }

    // 绘制水平网格线
    for (let r = startRow; r <= endRow; r++) {
      const rowY = r * config.cellHeight - y;
      if (rowY >= -1 && rowY <= tableHeight - y + 1) {
        const lineEndX = Math.min(w, tableWidth - x);
        // 跳过新增行按钮所在行
        if (r === rows.length) continue;

        ctx.moveTo(0, rowY - 0.5);
        ctx.lineTo(lineEndX, rowY - 0.5);
      }
    }

    ctx.strokeStyle = config.borderColor;
    ctx.lineWidth = config.borderWidth;
    ctx.stroke();
  };

  // 执行绘制
  const draw = () => {
    const content = contentRef.current;
    const header = headerRef.current;
    if (!content || !header) return;

    const ctx = content.getContext("2d");
    const hctx = header.getContext("2d");
    if (!ctx || !hctx) return;

    drawHeader(hctx);
    drawContent(ctx);
  };

  // 初始化和尺寸调整
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resize = () => {
      // 计算canvas尺寸（减去边框）
      const w = container.clientWidth - 2;
      const h = container.clientHeight - config.headerHeight - 2;
      viewportRef.current = { width: w, height: h };

      // 设置canvas高清显示
      const dpr = window.devicePixelRatio || 1;
      const content = contentRef.current!;
      const header = headerRef.current!;

      content.width = w * dpr;
      content.height = h * dpr;
      content.style.width = `${w}px`;
      content.style.height = `${h}px`;
      const ctx = content.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      header.width = w * dpr;
      header.height = config.headerHeight * dpr;
      header.style.width = `${w}px`;
      header.style.height = `${config.headerHeight}px`;
      const hctx = header.getContext("2d");
      if (hctx) hctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      draw();
    };

    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    container.addEventListener("scroll", onScroll);

    return () => {
      ro.disconnect();
      container.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    }, [cols.length, rows.length]);
  
  // 编辑框自动聚焦
  useEffect(() => {
    if (editingCell && editingCellRef.current) {
      editingCellRef.current.focus();
    }
  }, [editingCell]);

  return (
    <div
      style={{
        height: "100%",
        padding: 20,
        background: "#f8f9fa",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        ref={containerRef}
        style={{
          height: "100%",
          maxHeight: "100%",
          overflow: "auto",
          backgroundColor: "white",
          position: "relative",
          boxShadow: "none",
          border: "1px solid #ddd",
        }}
      >
        <div
          style={{
            width: totalWidth,
            height: totalHeight + config.headerHeight,
          }}
        />
      </div>

      <canvas
        ref={headerRef}
        onClick={handleHeaderClick}
        onMouseMove={handleHeaderMouseMove}
        style={{
          position: "absolute",
          top: 21,
          left: 21,
          zIndex: 5,
          background: "white",
          pointerEvents: "auto",
          display: "block",
        }}
      />
      <canvas
        ref={contentRef}
        onClick={handleCanvasClick}
        onMouseMove={handleContentMouseMove}
        onWheel={(e) => {
          e.stopPropagation();
          if (containerRef.current) {
            containerRef.current.scrollTop += e.deltaY;
            containerRef.current.scrollLeft += e.deltaX;
          }
        }}
        style={{
          position: "absolute",
          top: config.headerHeight + 21,
          left: 21,
          display: "block",
          zIndex: 1,
          pointerEvents: "auto",
          cursor: "default",
        }}
      />

      {editingCell && (
        <div
          ref={editingCellRef}
          contentEditable
          onBlur={handleEditBlur}
          onKeyDown={handleKeyDown}
          style={{
            position: "absolute",
            left: editingCell.col * config.cellWidth - scrollRef.current.x + 20,
            top:
              editingCell.row * config.cellHeight -
              scrollRef.current.y +
              config.headerHeight +
              20,
            width: config.cellWidth - 10,
            height: config.cellHeight - 4,
            border: "2px solid #4a90e2",
            padding: "0 5px",
            backgroundColor: "white",
            zIndex: 10,
            outline: "none",
            fontSize: `${config.fontSize}px`,
            lineHeight: `${config.cellHeight - 4}px`,
            boxSizing: "border-box",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          dangerouslySetInnerHTML={{ __html: editValue }}
          onInput={(e) => setEditValue(e.currentTarget.textContent || "")}
        />
      )}
    </div>
  );
};

export default MultiDimensionalTable;
