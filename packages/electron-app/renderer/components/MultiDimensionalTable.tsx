import React, { useRef, useEffect, useState } from "react";

// 定义单元格位置类型
interface CellPosition {
  row: number;
  col: number;
}

// 定义单元格数据类型
interface CellData {
  [key: string]: string;
}

const MultiDimensionalTable: React.FC = () => {
  const contentRef = useRef<HTMLCanvasElement | null>(null);
  const headerRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef({ x: 0, y: 0 });
  const viewportRef = useRef({ width: 0, height: 0 });
  const rafRef = useRef<number | null>(null);

  // 编辑状态相关
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null);
  const [editValue, setEditValue] = useState("");
  const editingCellRef = useRef<HTMLDivElement | null>(null);

  // 数据
  const cols = Array.from({ length: 30 }, (_, i) => i + 1);
  const rows = Array.from({ length: 1000 }, (_, i) => i + 1);

  // 单元格数据存储
  const cellDataRef = useRef<CellData>({});

  const config = {
    cellWidth: 160,
    cellHeight: 37,
    headerHeight: 44,
    headerBg: "#4a90e2",
    headerColor: "#fff",
    evenBg: "#f8f9fa",
    oddBg: "#fff",
    borderColor: "#eee",
    textColor: "#333",
    fontSize: 13,
    headerFontSize: 14,
  };

  const totalWidth = cols.length * config.cellWidth;
  const totalHeight = rows.length * config.cellHeight;

  // 获取单元格的值
  const getCellValue = (row: number, col: number) => {
    const key = `${row}-${col}`;
    return cellDataRef.current[key] || `Row ${rows[row]}, Column ${cols[col]}`;
  };

  // 设置单元格的值
  const setCellValue = (row: number, col: number, value: string) => {
    const key = `${row}-${col}`;
    cellDataRef.current[key] = value;
  };

  /** -------------------滚动事件------------------- */
  const onScroll = () => {
    if (!containerRef.current) return;
    const { scrollLeft, scrollTop } = containerRef.current;
    scrollRef.current = { x: scrollLeft, y: scrollTop };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
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

    ctx.fillStyle = config.headerColor;
    ctx.font = `bold ${config.headerFontSize}px Arial`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";

    ctx.beginPath();
    for (let c = startCol; c < endCol; c++) {
      const cx = c * config.cellWidth - x;
      ctx.fillText(`Column ${cols[c]}`, cx + 15, config.headerHeight / 2);
      ctx.moveTo(cx + config.cellWidth, 0);
      ctx.lineTo(cx + config.cellWidth, config.headerHeight);
    }
    ctx.strokeStyle = config.borderColor;
    ctx.stroke();
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

    // 列线
    ctx.beginPath();
    for (let c = startCol; c < endCol; c++) {
      const cx = c * config.cellWidth - x + config.cellWidth;
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, h);
    }

    // 行线
    for (let r = startRow; r < endRow; r++) {
      const rowY = r * config.cellHeight - y + config.cellHeight;
      ctx.moveTo(0, rowY);
      ctx.lineTo(w, rowY);
    }

    ctx.strokeStyle = config.borderColor;
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
  }, []);

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
      <canvas
        ref={headerRef}
        style={{
          position: "sticky",
          top: 0,
          left: 0,
          zIndex: 5,
          background: "white",
          pointerEvents: "none",
          display: "block",
          borderTopLeftRadius: "8px",
          borderTopRightRadius: "8px",
        }}
      />
      <div
        ref={containerRef}
        style={{
          height: "100%",
          maxHeight: "100%",
          overflow: "auto",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          backgroundColor: "white",
          position: "relative",
        }}
      >
        <div style={{ width: totalWidth, height: totalHeight }} />
      </div>
      <canvas
        ref={contentRef}
        onDoubleClick={handleCanvasClick}
        style={{
          position: "absolute",
          top: config.headerHeight + 20, // 添加 config.headerHeight 偏移
          left: 20,
          display: "block",
          width: "calc(100% - 40px)", // 考虑左右padding
          height: "calc(100% - 100px)", // 使用相对高度
          zIndex: 1,
          pointerEvents: "auto",
          cursor: "pointer",
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
            borderRadius: "2px",
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
