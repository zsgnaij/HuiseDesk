import React, { useRef, useEffect } from "react";

const VirtualCanvasTable: React.FC = () => {
  const contentRef = useRef<HTMLCanvasElement | null>(null);
  const headerRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef({ x: 0, y: 0 });
  const viewportRef = useRef({ width: 0, height: 0 });
  const rafRef = useRef<number | null>(null);

  // 数据
  const cols = Array.from({ length: 30 }, (_, i) => i + 1);
  const rows = Array.from({ length: 1000 }, (_, i) => i + 1);

  const config = {
    cellWidth: 160,
    cellHeight: 37,
    headerHeight: 41,
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

  /** -------------------滚动事件------------------- */
  const onScroll = () => {
    if (!containerRef.current) return;
    const { scrollLeft, scrollTop } = containerRef.current;
    scrollRef.current = { x: scrollLeft, y: scrollTop };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
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
        ctx.fillText(
          `Row ${rows[r]}, Column ${cols[c]}`,
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

  return (
    <div
      style={{
        height: "100%",
        padding: 20,
        background: "#f8f9fa",
        position: "relative",
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
        }}
      />
      <div
        ref={containerRef}
        style={{
          height: "calc(100vh - 180px)",
          overflow: "auto",
          position: "relative",
          background: "white",
        }}
      >
        <div style={{ width: totalWidth, height: totalHeight }} />
      </div>
      <canvas
        ref={contentRef}
        style={{
          position: "absolute",
          top: 41,
          left: 0,
          display: "block",
          width: "100%",
          height: "100%",
          zIndex: 1,
          pointerEvents: "none",
          margin: "20px 0 0 20px",
        }}
      />
    </div>
  );
};

export default VirtualCanvasTable;
