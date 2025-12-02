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
  const hoverRowRef = useRef<number>(-1);
  
  // 列宽调整相关
  const colWidthsRef = useRef<number[]>([]);
  const [, forceUpdate] = useState({});
  const resizingColRef = useRef<{ col: number; startX: number; startWidth: number } | null>(null);
  const hoverResizeColRef = useRef<number>(-1);

  // 编辑状态
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null);
  const [editValue, setEditValue] = useState("");
  const editingCellRef = useRef<HTMLDivElement | null>(null);
  const isEditingSwitchingRef = useRef(false); // 标记是否正在切换编辑
  
  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; col?: number; row?: number; type: 'header' | 'content' } | null>(null);
  
  // 选中状态
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const hoverIndexColRef = useRef<number>(-1);

  // 行列数据
  const [cols, setCols] = useState<number[]>(
    Array.from({ length: initialCols }, (_, i) => i + 1)
  );
  const [rows, setRows] = useState<number[]>(
    Array.from({ length: initialRows }, (_, i) => i + 1)
  );

  // 单元格数据存储
  const cellDataRef = useRef<CellData>({});
  
  // 初始化列宽
  useEffect(() => {
    if (colWidthsRef.current.length === 0) {
      colWidthsRef.current = new Array(cols.length).fill(config.cellWidth);
    } else if (colWidthsRef.current.length < cols.length) {
      colWidthsRef.current = [...colWidthsRef.current, ...new Array(cols.length - colWidthsRef.current.length).fill(config.cellWidth)];
    }
  }, [cols.length]);

  // 表格配置
  const config = {
    indexColWidth: 60, // 序号列宽度
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

 // 获取列宽
  const getColWidth = (col: number) => {
    return colWidthsRef.current[col] || config.cellWidth;
  };
  
  // 获取列的X坐标
  const getColX = (col: number) => {
    let x = 0;
    for (let i = 0; i < col; i++) {
      x += getColWidth(i);
    }
    return x;
  };
  
  // 计算总宽度（包含序号列和"+"号区域）
  const totalWidth = config.indexColWidth + cols.reduce((sum, _, i) => sum + getColWidth(i), 0) + config.cellWidth;
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
    // 自动聚焦到新行的第一列
    const newRowIndex = rows.length;
    setTimeout(() => {
      setEditingCell({ row: newRowIndex, col: 0 });
      setEditValue(getCellValue(newRowIndex, 0));
    }, 0);
  }, [rows.length]);

  // 删除行
  const deleteRow = useCallback((rowIndex: number) => {
    if (rows.length <= 1) {
      alert('至少需要保留一行');
      return;
    }
    
    // 删除行
    setRows(prev => prev.filter((_, i) => i !== rowIndex));
    
    // 删除该行的所有单元格数据
    const newCellData: CellData = {};
    Object.keys(cellDataRef.current).forEach(key => {
      const [row, col] = key.split('-').map(Number);
      if (row < rowIndex) {
        newCellData[key] = cellDataRef.current[key];
      } else if (row > rowIndex) {
        // 行索引减1
        newCellData[`${row - 1}-${col}`] = cellDataRef.current[key];
      }
    });
    cellDataRef.current = newCellData;
    
    // 如果正在编辑的单元格在被删除的行，取消编辑
    if (editingCell && editingCell.row === rowIndex) {
      setEditingCell(null);
      setEditValue('');
    } else if (editingCell && editingCell.row > rowIndex) {
      // 更新编辑单元格的行索引
      setEditingCell({ ...editingCell, row: editingCell.row - 1 });
    }
    
    // 强制更新
    forceUpdate({});
  }, [rows.length, editingCell]);

  // 删除列
  const deleteCol = useCallback((colIndex: number) => {
    if (cols.length <= 1) {
      alert('至少需要保留一列');
      return;
    }
    
    // 删除列
    setCols(prev => prev.filter((_, i) => i !== colIndex));
    
    // 删除列宽
    colWidthsRef.current = colWidthsRef.current.filter((_, i) => i !== colIndex);
    
    // 删除该列的所有单元格数据
    const newCellData: CellData = {};
    Object.keys(cellDataRef.current).forEach(key => {
      const [row, col] = key.split('-').map(Number);
      if (col < colIndex) {
        newCellData[key] = cellDataRef.current[key];
      } else if (col > colIndex) {
        // 列索引减1
        newCellData[`${row}-${col - 1}`] = cellDataRef.current[key];
      }
    });
    cellDataRef.current = newCellData;
    
    // 如果正在编辑的单元格在被删除的列，取消编辑
    if (editingCell && editingCell.col === colIndex) {
      setEditingCell(null);
      setEditValue('');
    } else if (editingCell && editingCell.col > colIndex) {
      // 更新编辑单元格的列索引
      setEditingCell({ ...editingCell, col: editingCell.col - 1 });
    }
    
    // 强制更新
    forceUpdate({});
  }, [cols.length, editingCell]);

  // 新增列
  const addCol = useCallback(() => {
    setCols((prev) => [...prev, prev.length + 1]);
  }, []);
  
  // 表头右键事件
  const handleHeaderContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!headerRef.current) return;

    const rect = headerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollRef.current.x;

    // 查找右键点击的列
    let col = -1;
    let currentX = 0;
    for (let i = 0; i < cols.length; i++) {
      const colWidth = getColWidth(i);
      if (x >= currentX && x < currentX + colWidth) {
        col = i;
        break;
      }
      currentX += colWidth;
    }

    // 如果点击的是有效列，显示右键菜单
    if (col >= 0 && col < cols.length) {
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        col,
        type: 'header'
      });
    }
  };
  
  // 内容区域右键事件
  const handleContentContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!contentRef.current) return;

    const rect = contentRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollRef.current.x;
    const y = e.clientY - rect.top + scrollRef.current.y;

    const row = Math.floor(y / config.cellHeight);

    // 如果点击的是有效行（不包括新增行按钮），显示右键菜单
    if (row >= 0 && row < rows.length) {
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        row,
        type: 'content'
      });
    }
  };
  
  // 关闭右键菜单
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);
  
  // 处理删除列操作
  const handleDeleteColumn = useCallback(() => {
    if (contextMenu && contextMenu.type === 'header' && contextMenu.col !== undefined) {
      deleteCol(contextMenu.col);
      closeContextMenu();
    }
  }, [contextMenu, deleteCol, closeContextMenu]);
  
  // 处理删除行操作
  const handleDeleteRow = useCallback(() => {
    if (contextMenu && contextMenu.type === 'content' && contextMenu.row !== undefined) {
      deleteRow(contextMenu.row);
      closeContextMenu();
    }
  }, [contextMenu, deleteRow, closeContextMenu]);

  // 切换全选
  const toggleSelectAll = () => {
    if (selectedRows.size === rows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(rows.map((_, i) => i)));
    }
  };
  
  // 切换单行选中
  const toggleRowSelect = (rowIndex: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowIndex)) {
      newSelected.delete(rowIndex);
    } else {
      newSelected.add(rowIndex);
    }
    setSelectedRows(newSelected);
  };

  // 滚动事件处理
  const onScroll = () => {
    if (!containerRef.current) return;
    const { scrollLeft, scrollTop } = containerRef.current;
    scrollRef.current = { x: scrollLeft, y: scrollTop };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
  };

  // 表头点击事件（全选或新增列）
  const handleHeaderClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!headerRef.current) return;
    if (resizingColRef.current) return;

    const rect = headerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollRef.current.x;

    // 点击序号列，切换全选
    if (x < config.indexColWidth) {
      toggleSelectAll();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(draw);
      return;
    }

    let currentX = config.indexColWidth;
    for (let i = 0; i < cols.length; i++) {
      currentX += getColWidth(i);
    }

    if (x >= currentX && x < currentX + config.cellWidth) {
      addCol();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(draw);
    }
  };

  // 内容区域点击事件（选中、编辑单元格或新增行）
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!contentRef.current || !containerRef.current) return;

    const rect = contentRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollRef.current.x;
    const y = e.clientY - rect.top + scrollRef.current.y;

    const row = Math.floor(y / config.cellHeight);

    // 点击序号列，切换选中
    if (x < config.indexColWidth && row >= 0 && row < rows.length) {
      // 先完成当前编辑
      if (editingCell) {
        setCellValue(editingCell.row, editingCell.col, editValue);
        setEditingCell(null);
        setEditValue("");
      }
      toggleRowSelect(row);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(draw);
      return;
    }

    // 查找点击的列（从序号列后开始）
    let col = -1;
    let currentX = config.indexColWidth;
    for (let i = 0; i < cols.length; i++) {
      const colWidth = getColWidth(i);
      if (x >= currentX && x < currentX + colWidth) {
        col = i;
        break;
      }
      currentX += colWidth;
    }

    // 点击新增行按钮
    if (row === rows.length) {
      // 先完成当前编辑
      if (editingCell) {
        setCellValue(editingCell.row, editingCell.col, editValue);
        setEditingCell(null);
        setEditValue("");
      }
      addRow();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(draw);
      return;
    }

    // 编辑单元格
    if (row >= 0 && row < rows.length && col >= 0 && col < cols.length) {
      // 标记正在切换编辑
      isEditingSwitchingRef.current = true;
      
      // 如果当前有编辑的单元格，先保存
      if (editingCell) {
        setCellValue(editingCell.row, editingCell.col, editValue);
      }
      
      // 立即设置新的编辑单元格
      setEditingCell({ row, col });
      setEditValue(getCellValue(row, col));
      
      // 重置切换标记
      setTimeout(() => {
        isEditingSwitchingRef.current = false;
      }, 200);
      
      const container = containerRef.current;
      
      // 确保编辑的单元格在视口内
      const cellTop = row * config.cellHeight;
      const cellBottom = cellTop + config.cellHeight;
      const cellLeft = config.indexColWidth + getColX(col);
      const cellRight = cellLeft + getColWidth(col);
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
    } else {
      // 点击了空白区域，完成当前编辑
      if (editingCell) {
        handleEditComplete();
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
    
    // 检查是否在列边框附近（可拖拽调整列宽）
    let currentX = config.indexColWidth;
    let nearResizeCol = -1;
    for (let i = 0; i < cols.length; i++) {
      currentX += getColWidth(i);
      if (Math.abs(x - currentX) < 5) {
        nearResizeCol = i;
        break;
      }
    }
    
    hoverResizeColRef.current = nearResizeCol;
    
    // 检查是否在新增列按钮上
    const lastColX = config.indexColWidth + cols.reduce((sum, _, i) => sum + getColWidth(i), 0) - scrollRef.current.x;
    const isOnAddColPlus = x >= lastColX && x < lastColX + config.cellWidth;
    
    // 检查是否在序号列
    const isOnIndexCol = x < config.indexColWidth;
    
    if (nearResizeCol !== -1) {
      headerRef.current.style.cursor = "col-resize";
    } else if (isOnAddColPlus || isOnIndexCol) {
      headerRef.current.style.cursor = "pointer";
    } else {
      headerRef.current.style.cursor = "default";
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
  };
  
  // 表头鼠标按下事件
  const handleHeaderMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!headerRef.current || hoverResizeColRef.current === -1) return;
    
    const rect = headerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollRef.current.x;
    
    resizingColRef.current = {
      col: hoverResizeColRef.current,
      startX: x,
      startWidth: getColWidth(hoverResizeColRef.current)
    };
  };
  
  // 全局鼠标移动事件（拖拽调整列宽）
  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingColRef.current || !headerRef.current) return;
    
    const rect = headerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollRef.current.x;
    const deltaX = x - resizingColRef.current.startX;
    const newWidth = Math.max(50, resizingColRef.current.startWidth + deltaX);
    
    // 直接修改ref，避免状态更新导致的闪烁
    colWidthsRef.current[resizingColRef.current.col] = newWidth;
    
    // 立即重绘
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
  }, []);
  
  // 全局鼠标释放事件
  const handleGlobalMouseUp = useCallback(() => {
    if (resizingColRef.current) {
      resizingColRef.current = null;
      // 松开时强制更新一次以保存最终状态
      forceUpdate({});
    }
  }, []);

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
    
    const row = Math.floor(y / config.cellHeight);
    
    // 更新悬停行（用于显示单选框）
    if (x < config.indexColWidth && row >= 0 && row < rows.length) {
      hoverIndexColRef.current = row;
    } else {
      hoverIndexColRef.current = -1;
    }
    
    // 更新悬停行（用于背景色）
    hoverRowRef.current = row < rows.length ? row : -1;
    
    // 检查是否在新增行按钮上
    const isOnAddRowPlus = row === rows.length;
    // 检查是否在序号列
    const isOnIndexCol = x < config.indexColWidth && row >= 0 && row < rows.length;
    
    if (isOnAddRowPlus || isOnIndexCol) {
      contentRef.current.style.cursor = "pointer";
    } else {
      contentRef.current.style.cursor = "default";
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
  };

  // 内容区域鼠标离开事件
  const handleContentMouseLeave = () => {
    hoverRowRef.current = -1;
    hoverIndexColRef.current = -1;
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
  const handleEditBlur = (e: React.FocusEvent) => {
    // 延迟处理，给点击事件时间先执行
    setTimeout(() => {
      // 如果正在切换编辑，不要完成编辑
      if (isEditingSwitchingRef.current) {
        return;
      }
      // 完成编辑
      if (editingCell) {
        handleEditComplete();
      }
    }, 150);
  };

  // 处理编辑框输入
  const handleEditInput = (e: React.FormEvent<HTMLDivElement>) => {
    setEditValue(e.currentTarget.textContent || "");
  };

  // 绘制表头
  const drawHeader = (ctx: CanvasRenderingContext2D) => {
    const { width: w } = viewportRef.current;
    const { x } = scrollRef.current;

    ctx.clearRect(0, 0, w, config.headerHeight);
    ctx.fillStyle = config.headerBg;
    ctx.fillRect(0, 0, w, config.headerHeight);

    // 绘制序号列表头（单选框）
    const indexColX = -x;
    ctx.fillStyle = config.headerBg;
    ctx.fillRect(indexColX, 0, config.indexColWidth, config.headerHeight);
    
    // 绘制全选复选框
    const checkboxSize = 14;
    const checkboxX = indexColX + (config.indexColWidth - checkboxSize) / 2;
    const checkboxY = (config.headerHeight - checkboxSize) / 2;
    
    // 绘制白色背景
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(checkboxX, checkboxY, checkboxSize, checkboxSize);
    
    // 绘制边框
    ctx.strokeStyle = "#d0d0d0";
    ctx.lineWidth = 1;
    ctx.strokeRect(checkboxX, checkboxY, checkboxSize, checkboxSize);
    
    // 如果全选，绘制勾
    if (selectedRows.size === rows.length && rows.length > 0) {
      ctx.strokeStyle = "#4a90e2";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(checkboxX + 3, checkboxY + 7);
      ctx.lineTo(checkboxX + 5, checkboxY + 9);
      ctx.lineTo(checkboxX + 11, checkboxY + 3);
      ctx.stroke();
    }
    
    // 计算可见列范围
    const bufferCols = 2;
    let startCol = -1;
    let endCol = -1;
    let currentX = config.indexColWidth;
    
    for (let i = 0; i < cols.length; i++) {
      const colWidth = getColWidth(i);
      if (currentX + colWidth >= x - bufferCols * config.cellWidth && startCol === -1) {
        startCol = Math.max(0, i - bufferCols);
      }
      if (currentX > x + w + bufferCols * config.cellWidth && endCol === -1) {
        endCol = Math.min(cols.length, i + bufferCols);
        break;
      }
      currentX += colWidth;
    }
    
    if (startCol === -1) startCol = 0;
    if (endCol === -1) endCol = cols.length;

    // 绘制列分隔线（从第二列开始，跳过序号列）
    ctx.beginPath();
    currentX = config.indexColWidth;
    for (let c = 0; c <= endCol; c++) {
      if (c >= startCol && c > 0) { // c > 0 跳过序号列右侧的线
        const cx = currentX - x;
        ctx.moveTo(cx - 0.5, 0);
        ctx.lineTo(cx - 0.5, config.headerHeight);
      }
      if (c < cols.length) {
        currentX += getColWidth(c);
      }
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

    currentX = config.indexColWidth;
    for (let c = 0; c < cols.length; c++) {
      const colWidth = getColWidth(c);
      if (c >= startCol && c < endCol) {
        const cx = currentX - x;
        ctx.fillText(`Column ${cols[c]}`, cx + 15, config.headerHeight / 2);
      }
      currentX += colWidth;
    }

    // 绘制新增列按钮
    const lastColX = currentX - x;
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

    let startCol = -1;
    let endCol = -1;
    let currentX = config.indexColWidth;
    
    for (let i = 0; i < cols.length; i++) {
      const colWidth = getColWidth(i);
      if (currentX + colWidth >= x - bufferCols * config.cellWidth && startCol === -1) {
        startCol = Math.max(0, i - bufferCols);
      }
      if (currentX > x + w + bufferCols * config.cellWidth && endCol === -1) {
        endCol = Math.min(cols.length, i + bufferCols);
        break;
      }
      currentX += colWidth;
    }
    
    if (startCol === -1) startCol = 0;
    if (endCol === -1) endCol = cols.length;

    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.font = `${config.fontSize}px Arial`;
    
    // 计算表格实际尺寸
    const tableWidth = config.indexColWidth + cols.reduce((sum, _, i) => sum + getColWidth(i), 0);
    const tableHeight = rows.length * config.cellHeight;
    
    // 绘制单元格背景和内容
    for (let r = startRow; r < endRow; r++) {
      const rowY = r * config.cellHeight - y;
      
      // 判断是否是悬停行或选中行
      const isHoverRow = hoverRowRef.current === r;
      const isSelectedRow = selectedRows.has(r);
      let bg;
      if (isSelectedRow) {
        bg = "#e3f2fd"; // 选中行浅蓝色背景
      } else if (isHoverRow) {
        bg = "#f5f5f5"; // 悬停行浅灰色背景
      } else {
        bg = r % 2 === 0 ? config.evenBg : config.oddBg; // 默认背景
      }
      
      ctx.fillStyle = bg;
      // 背景宽度不超过表格宽度
      const bgWidth = Math.min(w, tableWidth - x);
      ctx.fillRect(0, rowY, bgWidth, config.cellHeight);
      
      // 绘制序号列（序号或复选框）
      const indexColX = -x;
      const isHoverIndex = hoverIndexColRef.current === r;
      const isSelected = selectedRows.has(r);
      
      if (isHoverIndex || isSelected) {
        // 绘制复选框
        const checkboxSize = 14;
        const checkboxX = indexColX + (config.indexColWidth - checkboxSize) / 2;
        const checkboxY = rowY + (config.cellHeight - checkboxSize) / 2;
        
        // 绘制白色背景
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(checkboxX, checkboxY, checkboxSize, checkboxSize);
        
        // 绘制边框
        ctx.strokeStyle = "#d0d0d0";
        ctx.lineWidth = 1;
        ctx.strokeRect(checkboxX, checkboxY, checkboxSize, checkboxSize);
        
        // 如果选中，绘制勾
        if (isSelected) {
          ctx.strokeStyle = "#4a90e2";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(checkboxX + 3, checkboxY + 7);
          ctx.lineTo(checkboxX + 5, checkboxY + 9);
          ctx.lineTo(checkboxX + 11, checkboxY + 3);
          ctx.stroke();
        }
      } else {
        // 绘制序号
        ctx.fillStyle = config.textColor;
        ctx.textAlign = "center";
        ctx.fillText(
          String(r + 1),
          indexColX + config.indexColWidth / 2,
          rowY + config.cellHeight / 2
        );
        ctx.textAlign = "left";
      }
      
      let colX = config.indexColWidth;
      for (let c = 0; c < cols.length; c++) {
        const colWidth = getColWidth(c);
        if (c >= startCol && c < endCol) {
          const cellX = colX - x;
          ctx.fillStyle = config.textColor;
          if (editingCell && editingCell.row === r && editingCell.col === c) {
            ctx.fillStyle = "#e3f2fd";
            ctx.fillRect(cellX, rowY, colWidth, config.cellHeight);
            ctx.fillStyle = config.textColor;
          }

          ctx.fillText(
            getCellValue(r, c),
            cellX + 15,
            rowY + config.cellHeight / 2
          );
        }
        colX += colWidth;
      }
    }
    
    // 计算最后一行位置
    const lastRowY = rows.length * config.cellHeight - y;
        
    // 绘制新增行按钮（靠左显示，宽度为所有列宽之和加序号列）
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

      // 绘制上边框
      ctx.beginPath();
      ctx.moveTo(0, lastRowY - 0.5);
      ctx.lineTo(tableWidth, lastRowY - 0.5);
      ctx.stroke();

      // 绘制底部边框（延伸到整个视口宽度）
      ctx.beginPath();
      ctx.moveTo(0, lastRowY + config.cellHeight - 0.5);
      ctx.lineTo(w, lastRowY + config.cellHeight - 0.5);
      ctx.stroke();
      
      // 绘制右边框
      ctx.beginPath();
      ctx.moveTo(tableWidth - 0.5, lastRowY);
      ctx.lineTo(tableWidth - 0.5, lastRowY + config.cellHeight);
      ctx.stroke();

      ctx.fillStyle = "#666";
      ctx.font = `bold ${config.fontSize + 4}px Arial`;
      ctx.textAlign = "left";
      ctx.fillText("+", config.indexColWidth + 15, lastRowY + config.cellHeight / 2);
    }

    // 绘制网格线
    ctx.beginPath();
    
    // 绘制垂直网格线（跳过序号列右侧的线）
    currentX = config.indexColWidth;
    for (let c = 0; c <= cols.length; c++) {
      if (c >= startCol && c <= endCol) {
        const cx = currentX - x;
        // 跳过第一条线（序号列右侧）
        if (c > 0 && cx >= -1 && cx <= tableWidth - x + 1) {
          const lineEndY = Math.min(h, tableHeight - y);
          ctx.moveTo(cx - 0.5, 0);
          ctx.lineTo(cx - 0.5, lineEndY);
        }
      }
      if (c < cols.length) {
        currentX += getColWidth(c);
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
    document.addEventListener("mousemove", handleGlobalMouseMove);
    document.addEventListener("mouseup", handleGlobalMouseUp);
    document.addEventListener("click", closeContextMenu);

    return () => {
      ro.disconnect();
      container.removeEventListener("scroll", onScroll);
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
      document.removeEventListener("click", closeContextMenu);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    }, [cols.length, rows.length, handleGlobalMouseMove, handleGlobalMouseUp, draw, closeContextMenu]);
  
  // 编辑框自动聚焦
  useEffect(() => {
    if (editingCell && editingCellRef.current) {
      editingCellRef.current.textContent = editValue;
      editingCellRef.current.focus();
      // 将光标移到末尾
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(editingCellRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [editingCell]);
  
  // 编辑框位置跟随滚动更新
  useEffect(() => {
    if (!editingCell || !editingCellRef.current || !containerRef.current) return;
    
    const updateEditBoxPosition = () => {
      if (!editingCell || !editingCellRef.current) return;
      
      const { scrollLeft, scrollTop } = containerRef.current!;
      const left = config.indexColWidth + getColX(editingCell.col) - scrollLeft + 21;
      const top = editingCell.row * config.cellHeight - scrollTop + config.headerHeight + 21;
      
      editingCellRef.current.style.left = `${left}px`;
      editingCellRef.current.style.top = `${top}px`;
    };
    
    // 监听滚动事件
    const container = containerRef.current;
    container.addEventListener('scroll', updateEditBoxPosition);
    
    return () => {
      container.removeEventListener('scroll', updateEditBoxPosition);
    };
  }, [editingCell, config.indexColWidth, config.cellHeight, config.headerHeight]);

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
        onMouseDown={handleHeaderMouseDown}
        onMouseMove={handleHeaderMouseMove}
        onContextMenu={handleHeaderContextMenu}
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
        onMouseLeave={handleContentMouseLeave}
        onContextMenu={handleContentContextMenu}
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
          spellCheck={false}
          onBlur={handleEditBlur}
          onKeyDown={handleKeyDown}
          onInput={handleEditInput}
          style={{
            position: "absolute",
            left: config.indexColWidth + getColX(editingCell.col) - scrollRef.current.x + 21,
            top:
              editingCell.row * config.cellHeight -
              scrollRef.current.y +
              config.headerHeight +
              21,
            width: getColWidth(editingCell.col),
            height: config.cellHeight,
            border: "2px solid #4a90e2",
            padding: "0 15px",
            backgroundColor: "white",
            zIndex: 10,
            outline: "none",
            fontSize: `${config.fontSize}px`,
            fontFamily: "Arial",
            lineHeight: `${config.cellHeight}px`,
            boxSizing: "border-box",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        />
      )}
      
      {/* 右键菜单 */}
      {contextMenu && (
        <div
          style={{
            position: "fixed",
            left: contextMenu.x,
            top: contextMenu.y,
            backgroundColor: "white",
            border: "1px solid #ddd",
            borderRadius: "4px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            zIndex: 1000,
            minWidth: "120px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'header' && (
            <div
              onClick={handleDeleteColumn}
              style={{
                padding: "8px 16px",
                cursor: "pointer",
                fontSize: "13px",
                color: "#333",
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f5f5"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
            >
              删除列
            </div>
          )}
          {contextMenu.type === 'content' && (
            <div
              onClick={handleDeleteRow}
              style={{
                padding: "8px 16px",
                cursor: "pointer",
                fontSize: "13px",
                color: "#333",
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f5f5"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
            >
              删除记录
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiDimensionalTable;
