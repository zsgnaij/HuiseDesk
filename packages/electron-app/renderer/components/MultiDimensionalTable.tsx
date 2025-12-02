import React, { useRef, useEffect, useState, useCallback } from "react";

// 定义单元格位置类型
interface CellPosition {
  row: number;
  col: number;
}

// 定义单元格数据类型
interface CellData {
  [key: string]: string;
}

// 定义组件属性类型（现在为空，因为我们不使用props）
interface MultiDimensionalTableProps {}

const MultiDimensionalTable: React.FC<MultiDimensionalTableProps> = () => {
  // 将默认行列数改为5
  const initialRows = 5;
  const initialCols = 5;
  const contentRef = useRef<HTMLCanvasElement | null>(null);
  const headerRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef({ x: 0, y: 0 });
  const viewportRef = useRef({ width: 0, height: 0 });
  const rafRef = useRef<number | null>(null);
  const mousePositionRef = useRef({ x: -1, y: -1 }); // 添加鼠标位置跟踪

  // 编辑状态相关
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null);
  const [editValue, setEditValue] = useState("");
  const editingCellRef = useRef<HTMLDivElement | null>(null);

  // 动态行列数据
  const [cols, setCols] = useState<number[]>(Array.from({ length: initialCols }, (_, i) => i + 1));
  const [rows, setRows] = useState<number[]>(Array.from({ length: initialRows }, (_, i) => i + 1));

  // 单元格数据存储
  const cellDataRef = useRef<CellData>({});

  const config = {
    cellWidth: 160,
    cellHeight: 37,
    headerHeight: 44,
    headerBg: "#ffffff",
    headerColor: "#333", // 保持深色文字以确保与白色背景有足够对比度
    evenBg: "#ffffff",
    oddBg: "#ffffff",
    borderColor: "#ddd",
    textColor: "#333",
    fontSize: 13,
    headerFontSize: 14,
    borderWidth: 1, // 添加边框宽度配置
  };

  const totalWidth = cols.length * config.cellWidth;
  const totalHeight = rows.length * config.cellHeight;

  // 获取单元格的值
  const getCellValue = (row: number, col: number) => {
    const key = `${row}-${col}`;
    return cellDataRef.current[key] || "";
  };

  // 设置单元格的值
  const setCellValue = (row: number, col: number, value: string) => {
    const key = `${row}-${col}`;
    cellDataRef.current[key] = value;
  };

  // 新增行
  const addRow = useCallback(() => {
    setRows(prev => [...prev, prev.length + 1]);
  }, []);

  // 新增列
  const addCol = useCallback(() => {
    setCols(prev => [...prev, prev.length + 1]);
  }, []);

  /** -------------------滚动事件------------------- */
  const onScroll = () => {
    if (!containerRef.current) return;
    const { scrollLeft, scrollTop } = containerRef.current;
    scrollRef.current = { x: scrollLeft, y: scrollTop };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
  };

  /** -------------------处理表头点击------------------- */
  const handleHeaderClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!headerRef.current) return;

    const rect = headerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollRef.current.x;

    // 计算点击的列
    const col = Math.floor(x / config.cellWidth);

    // 检查是否点击了新增列的 "+" 号（在最后一列最右端）
    if (col === cols.length) {
      addCol();
      // 重新绘制以更新界面
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(draw);
    }
  };

  /** -------------------处理单元格点击------------------- */
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!contentRef.current || !containerRef.current) return;

    const rect = contentRef.current.getBoundingClientRect();
    // 修正坐标计算，考虑新的布局和边距
    const x = e.clientX - rect.left + scrollRef.current.x;
    const y = e.clientY - rect.top + scrollRef.current.y;

    // 计算点击的行列
    const col = Math.floor(x / config.cellWidth);
    // 注意：这里不需要减去 config.headerHeight，因为 content canvas 不包含表头
    const row = Math.floor(y / config.cellHeight);

    // 检查是否点击了新增行的 "+" 号（在最后一行，整行宽度）
    if (row === rows.length) {
      addRow();
      // 重新绘制以更新界面
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(draw);
      return;
    }
            
    // 不处理内容区域右下角的 "+" 号点击事件

    // 检查是否在有效范围内
    if (row >= 0 && row < rows.length && col >= 0 && col < cols.length) {
      // 设置编辑状态
      setEditingCell({ row, col });
      setEditValue(getCellValue(row, col));

      // 确保单元格在视口中可见
      const container = containerRef.current;
      const cellTop = row * config.cellHeight;
      const cellBottom = cellTop + config.cellHeight;
      const cellLeft = col * config.cellWidth;
      const cellRight = cellLeft + config.cellWidth;

      // 检查是否需要滚动
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

  /** -------------------处理表头鼠标移动------------------- */
  const handleHeaderMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!headerRef.current) return;
    
    const rect = headerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollRef.current.x;
    
    // 更新鼠标位置
    mousePositionRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    
    // 计算鼠标所在的列
    const col = Math.floor(x / config.cellWidth);
    
    // 检查是否在新增列的 "+" 号上（最后一列最右端）
    const isOnAddColPlus = col === cols.length;
    
    // 设置鼠标样式
    if (isOnAddColPlus) {
      headerRef.current.style.cursor = "pointer";
    } else {
      headerRef.current.style.cursor = "default";
    }
    
    // 重新绘制以更新悬停效果
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
  };
  
  /** -------------------处理内容区域鼠标移动------------------- */
  const handleContentMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!contentRef.current) return;
    
    const rect = contentRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollRef.current.x;
    const y = e.clientY - rect.top + scrollRef.current.y;
    
    // 更新鼠标位置
    mousePositionRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    
    // 计算鼠标所在的行列
    const col = Math.floor(x / config.cellWidth);
    const row = Math.floor(y / config.cellHeight);
    
    // 检查是否在新增行的 "+" 号上（最后一行，整行宽度）
    const isOnAddRowPlus = row === rows.length;
    
    // 不检查内容区域右下角的 "+" 号
    
    // 设置鼠标样式
    if (isOnAddRowPlus) {
      contentRef.current.style.cursor = "pointer";
    } else {
      contentRef.current.style.cursor = "default";
    }
    
    // 重新绘制以更新悬停效果
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
  };

  /** -------------------处理编辑完成------------------- */
  const handleEditComplete = () => {
    if (editingCell) {
      setCellValue(editingCell.row, editingCell.col, editValue);
      setEditingCell(null);
      setEditValue("");
      // 重新绘制
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(draw);
    }
  };

  /** -------------------处理编辑取消------------------- */
  const handleEditCancel = () => {
    setEditingCell(null);
    setEditValue("");
  };

  /** -------------------处理键盘事件------------------- */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleEditComplete();
    } else if (e.key === "Escape") {
      handleEditCancel();
    }
  };

  /** -------------------处理编辑框失去焦点------------------- */
  const handleEditBlur = () => {
    // 延迟执行，确保这是真正的失去焦点而不是临时的
    setTimeout(() => {
      handleEditComplete();
    }, 100);
  };

  /** -------------------绘制 Header------------------- */
  const drawHeader = (ctx: CanvasRenderingContext2D) => {
    const { width: w } = viewportRef.current;
    const { x } = scrollRef.current;

    ctx.clearRect(0, 0, w, config.headerHeight);

    ctx.fillStyle = config.headerBg;
    ctx.fillRect(0, 0, w, config.headerHeight);

    const bufferCols = 2;
    const startCol = Math.max(0, Math.floor(x / config.cellWidth) - bufferCols);
    const visibleCols = Math.ceil(w / config.cellWidth);
    const endCol = Math.min(
      cols.length,
      startCol + visibleCols + bufferCols * 2
    );

    // 先绘制网格线
    ctx.beginPath();
    for (let c = startCol; c < endCol; c++) {
      const cx = c * config.cellWidth - x;
      // 使用新的边框宽度
      ctx.moveTo(cx + config.cellWidth - 0.5, 0);
      ctx.lineTo(cx + config.cellWidth - 0.5, config.headerHeight);
    }
    
    // 绘制表头左侧边框线
    ctx.moveTo(0.5, 0);
    ctx.lineTo(0.5, config.headerHeight);
    
    // 绘制表头顶部边框线
    ctx.moveTo(0, 0.5);
    ctx.lineTo(w, 0.5);
    
    // 绘制表头底部边框线
    ctx.moveTo(0, config.headerHeight - 0.5);
    ctx.lineTo(w, config.headerHeight - 0.5);
    
    ctx.strokeStyle = config.borderColor;
    ctx.lineWidth = config.borderWidth;
    ctx.stroke();

    // 再绘制文字，确保文字在边框之上
    ctx.fillStyle = config.headerColor;
    ctx.font = `bold ${config.headerFontSize}px Arial`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";

    for (let c = startCol; c < endCol; c++) {
      const cx = c * config.cellWidth - x;
      ctx.fillText(`Column ${cols[c]}`, cx + 15, config.headerHeight / 2);
    }

    // 只在最后一列最右端绘制 "+" 号用于新增列
    const lastColX = cols.length * config.cellWidth - x;
    if (lastColX >= -config.cellWidth && lastColX < w) {
      // 检查鼠标是否悬停在新增列的 "+" 号上
      const isHovered = mousePositionRef.current.x >= lastColX && 
                        mousePositionRef.current.x < lastColX + config.cellWidth && 
                        mousePositionRef.current.y >= 0 && 
                        mousePositionRef.current.y < config.headerHeight;
      
      ctx.fillStyle = isHovered ? "#e8e8e8" : "#ffffff"; // 悬停时使用浅灰色背景，默认白色
      ctx.fillRect(lastColX, 0, config.cellWidth, config.headerHeight);
      
      ctx.strokeStyle = config.borderColor;
      ctx.lineWidth = config.borderWidth;
      
      // 不绘制左边框线，因为它与表头最后一列的右边框线重叠
      
      // 绘制右边框线
      ctx.beginPath();
      ctx.moveTo(lastColX + config.cellWidth - 0.5, 0);
      ctx.lineTo(lastColX + config.cellWidth - 0.5, config.headerHeight);
      ctx.stroke();
      
      // 绘制顶部边框线
      ctx.beginPath();
      ctx.moveTo(lastColX, 0.5);
      ctx.lineTo(lastColX + config.cellWidth, 0.5);
      ctx.stroke();
      
      // 绘制底部边框线
      ctx.beginPath();
      ctx.moveTo(lastColX, config.headerHeight - 0.5);
      ctx.lineTo(lastColX + config.cellWidth, config.headerHeight - 0.5);
      ctx.stroke();
      
      ctx.fillStyle = "#666";
      ctx.font = `bold ${config.headerFontSize + 4}px Arial`;
      ctx.textAlign = "center";
      ctx.fillText("+", lastColX + config.cellWidth / 2, config.headerHeight / 2);
    }
  };

  /** -------------------绘制内容------------------- */
  const drawContent = (ctx: CanvasRenderingContext2D) => {
    const { width: w, height: h } = viewportRef.current;
    const { x, y } = scrollRef.current;

    ctx.clearRect(0, 0, w, h);

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

        // 如果是正在编辑的单元格，绘制高亮背景
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

    // 计算最后一行和最后一列的位置
    const lastRowY = rows.length * config.cellHeight - y;
    const lastColX = cols.length * config.cellWidth - x;
    
    // 计算表格的实际宽度和高度
    const tableWidth = cols.length * config.cellWidth;
    const tableHeight = rows.length * config.cellHeight;
    
    // 只在最后一行绘制 "+" 号用于新增行，宽度为总列宽度
    if (lastRowY >= -config.cellHeight && lastRowY < h) {
      // 检查鼠标是否悬停在新增行的 "+" 号上
      const isHovered = mousePositionRef.current.x >= 0 && 
                        mousePositionRef.current.x < tableWidth && 
                        mousePositionRef.current.y >= lastRowY && 
                        mousePositionRef.current.y < lastRowY + config.cellHeight;
      
      ctx.fillStyle = isHovered ? "#e8e8e8" : "#ffffff"; // 悬停时使用浅灰色背景，默认白色
      ctx.fillRect(0, lastRowY, tableWidth, config.cellHeight);
      
      // 绘制整行的左边框线
      ctx.strokeStyle = config.borderColor;
      ctx.lineWidth = config.borderWidth;
      ctx.beginPath();
      ctx.moveTo(0.5, lastRowY);
      ctx.lineTo(0.5, lastRowY + config.cellHeight);
      ctx.stroke();
      
      // 绘制整行的右边框线
      const rightX = Math.min(tableWidth, w) - 0.5;
      ctx.beginPath();
      ctx.moveTo(rightX, lastRowY);
      ctx.lineTo(rightX, lastRowY + config.cellHeight);
      ctx.stroke();
      
      // 绘制整行的上边框线
      ctx.beginPath();
      ctx.moveTo(0, lastRowY - 0.5);
      ctx.lineTo(w, lastRowY - 0.5);
      ctx.stroke();
      
      // 绘制整行的下边框线
      ctx.beginPath();
      ctx.moveTo(0, lastRowY + config.cellHeight - 0.5);
      ctx.lineTo(w, lastRowY + config.cellHeight - 0.5);
      ctx.stroke();
      
      ctx.fillStyle = "#666";
      ctx.font = `bold ${config.fontSize + 4}px Arial`;
      ctx.textAlign = "center";
      ctx.fillText("+", tableWidth / 2, lastRowY + config.cellHeight / 2);
    }

    // 不在内容区域右下角绘制 "+" 号

    // 绘制网格线
    ctx.beginPath();
    
    // 绘制canvas左侧边框线
    ctx.moveTo(0.5, 0);
    ctx.lineTo(0.5, Math.min(h, tableHeight - y));
    
    // 绘制垂直线，但不超过表格实际宽度
    for (let c = startCol; c <= endCol; c++) {
      const cx = c * config.cellWidth - x;
      // 只绘制在表格范围内的垂直线
      if (cx >= -1 && cx <= tableWidth - x + 1) {
        const lineEndY = Math.min(h, tableHeight - y);
        ctx.moveTo(cx - 0.5, 0);
        ctx.lineTo(cx - 0.5, lineEndY);
      }
    }

    // 绘制水平线，但不超过表格实际高度
    for (let r = startRow; r <= endRow; r++) {
      const rowY = r * config.cellHeight - y;
      // 只绘制在表格范围内的水平线
      if (rowY >= -1 && rowY <= tableHeight - y + 1) {
        const lineEndX = Math.min(w, tableWidth - x);
        
        // 跳过最后一行，因为最后一行的横向线已经在绘制"+"号时单独绘制了
        if (r === rows.length) continue;
        
        ctx.moveTo(0, rowY - 0.5);
        ctx.lineTo(lineEndX, rowY - 0.5);
      }
    }

    ctx.strokeStyle = config.borderColor;
    ctx.lineWidth = config.borderWidth;
    ctx.stroke();
  };

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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resize = () => {
      const w = container.clientWidth;
      // 考虑表头高度来计算内容区域的高度
      const h = container.clientHeight;
      viewportRef.current = { width: w, height: h };

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

  // 当编辑状态改变时，聚焦到输入框
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
        overflow: "hidden", // 防止外部出现滚动条
      }}
    >
      {/* 移除原有的按钮 */}
      
      <canvas
        ref={headerRef}
        onClick={handleHeaderClick} // 添加点击事件处理
        onMouseMove={handleHeaderMouseMove} // 添加鼠标移动事件处理
        style={{
          position: "sticky",
          top: 0,
          left: 0,
          zIndex: 5,
          background: "white",
          pointerEvents: "auto", // 修改为auto以接收点击事件
          display: "block",
          borderTopLeftRadius: "0px",
          borderTopRightRadius: "0px",
        }}
      />
      <div
        ref={containerRef}
        style={{
          height: "100%",
          maxHeight: "100%",
          overflow: "auto",
          backgroundColor: "white",
          position: "relative",
          borderRadius: "0px",
          boxShadow: "none",
          border: "1px solid #ddd", // 添加外围边框
        }}
      >
        <div style={{ width: totalWidth, height: totalHeight }} />
      </div>
      <canvas
        ref={contentRef}
        onClick={handleCanvasClick}
        onMouseMove={handleContentMouseMove} // 添加鼠标移动事件处理
        onWheel={(e) => {
          // 阻止事件冒泡，让滚轮事件传递到容器
          e.stopPropagation();
          // 将滚轮事件传递给容器
          if (containerRef.current) {
            containerRef.current.scrollTop += e.deltaY;
            containerRef.current.scrollLeft += e.deltaX;
          }
        }}
        style={{
          position: "absolute",
          top: config.headerHeight + 20, // 添加 config.headerHeight 偏移
          left: 20,
          display: "block",
          width: "calc(100% - 40px)", // 考虑左右padding
          height: "calc(100% - 64px)", // 调整高度以确保与表头对齐
          zIndex: 1,
          pointerEvents: "auto",
          cursor: "default", // 默认鼠标样式
          borderRadius: "0px",
        }}
      />

      {/* 编辑输入框 */}
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
              20, // 添加 config.headerHeight 偏移
            width: config.cellWidth - 10,
            height: config.cellHeight - 4,
            border: "2px solid #4a90e2",
            borderRadius: "0px",
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