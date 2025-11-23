import React, { useState, useEffect, useRef } from "react";
import DomTable from "../components/Table/DomTable";
import VirtualDomTable from "../components/Table/VirtualDomTable";
import CanvasTable from "../components/Table/CanvasTable";
import VirtualCanvasTable from "../components/Table/VirtualCanvasTable";
import { collectWebVitals, WebVitalsData } from "../utils/webVitalsCollector";
import { analyzeWebVitalsWithLLM } from "../utils/llmAnalyzer";
import { Drawer, Button, Spin } from "antd";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const MDTPage: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<
    "normal" | "virtual" | "canvas" | "virtualCanvas"
  >("normal");
  const [llmAnalysis, setLlmAnalysis] = useState<string>("");
  const [isAnalysisLoading, setIsAnalysisLoading] = useState<boolean>(false);

  // 抽屉状态
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // 用于防止重复分析的ref
  const analyzeTriggered = useRef(false);

  // 初始化web-vitals采集和分析
  useEffect(() => {
    collectWebVitals(async (data: WebVitalsData) => {
      // 只有在未触发过分析时才进行分析
      if (!analyzeTriggered.current) {
        console.log("[Web Vitals] Collected data:", data);
        // 页面加载时就进行分析
        analyzePerformance(data);
        // 标记已触发分析
        analyzeTriggered.current = true;
      }
    });
  }, []);

  // 性能分析函数
  const analyzePerformance = async (data: WebVitalsData) => {
    setIsAnalysisLoading(true);
    try {
      const analysisResult = await analyzeWebVitalsWithLLM(data);
      setLlmAnalysis(analysisResult);
      console.log("[Web Vitals] LLM Analysis:", analysisResult);
    } catch (error) {
      console.error("性能分析失败:", error);
    } finally {
      setIsAnalysisLoading(false);
    }
  };

  const renderTable = () => {
    if (selectedTable === "normal") {
      return <DomTable />;
    } else if (selectedTable === "virtual") {
      return <VirtualDomTable />;
    } else if (selectedTable === "canvas") {
      return <CanvasTable />;
    } else if (selectedTable === "virtualCanvas") {
      return <VirtualCanvasTable />;
    }
    return null;
  };

  // 点击按钮直接展示分析结果，不再调用接口
  const handleShowAnalysis = () => {
    // 如果正在分析中，不打开抽屉
    if (isAnalysisLoading) {
      return;
    }
    setIsDrawerOpen(true);
  };

  return (
    <div style={styles.container}>
      <main style={styles.main}>
        {/* 顶部标题栏 */}
        <div style={styles.header}>
          <div>
            <h3>大数据表格展示</h3>
            <p>展示一个包含1000行30列数据的表格组件</p>
          </div>
          <Button
            type="primary"
            onClick={handleShowAnalysis}
            loading={isAnalysisLoading}
          >
            首屏加载性能分析
          </Button>
        </div>

        {/* 表格切换选项 */}
        <div style={styles.selectorContainer}>
          <div style={styles.selector}>
            <label style={styles.label}>
              <input
                type="radio"
                value="normal"
                checked={selectedTable === "normal"}
                onChange={() => setSelectedTable("normal")}
                style={styles.radio}
              />
              普通表格
            </label>
            <label style={styles.label}>
              <input
                type="radio"
                value="virtual"
                checked={selectedTable === "virtual"}
                onChange={() => setSelectedTable("virtual")}
                style={styles.radio}
              />
              虚拟滚动表格
            </label>
            <label style={styles.label}>
              <input
                type="radio"
                value="canvas"
                checked={selectedTable === "canvas"}
                onChange={() => setSelectedTable("canvas")}
                style={styles.radio}
              />
              Canvas表格
            </label>
            <label style={styles.label}>
              <input
                type="radio"
                value="virtualCanvas"
                checked={selectedTable === "virtualCanvas"}
                onChange={() => setSelectedTable("virtualCanvas")}
                style={styles.radio}
              />
              Canvas虚拟滚动表格
            </label>
          </div>
        </div>

        {/* 根据选择显示相应的表格 */}
        <div style={styles.tableContainer}>{renderTable()}</div>
      </main>

      {/* Antd Drawer */}
      <Drawer
        title="首屏加载性能分析报告"
        placement="right"
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        size="large"
      >
        {llmAnalysis ? (
          <div style={styles.markdownContainer}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {llmAnalysis}
            </ReactMarkdown>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <Spin size="large" />
            <p>正在生成分析报告...</p>
          </div>
        )}
      </Drawer>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  main: {
    flex: 1,
    overflow: "hidden",
    padding: "20px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  selectorContainer: {
    marginBottom: "20px",
  },
  selector: {
    display: "flex",
    gap: "20px",
    padding: "10px",
    backgroundColor: "#f5f5f5",
    borderRadius: "4px",
  },
  label: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    cursor: "pointer",
    fontSize: "14px",
  },
  radio: {
    cursor: "pointer",
  },
  tableContainer: {
    flex: 1,
    overflow: "auto",
    height: "calc(100% - 120px)",
  },
  // Markdown样式
  markdownContainer: {
    fontSize: "14px",
    lineHeight: "1.6",
    color: "#333",
    padding: "16px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
};

// 添加Markdown组件的内联样式
const markdownComponents = {
  h1: ({ node, ...props }: any) => <h1 style={{ fontSize: "24px", fontWeight: "bold", marginTop: "24px", marginBottom: "16px", borderBottom: "1px solid #eaecef", paddingBottom: "8px" }} {...props} />,
  h2: ({ node, ...props }: any) => <h2 style={{ fontSize: "20px", fontWeight: "bold", marginTop: "20px", marginBottom: "12px", borderBottom: "1px solid #eaecef", paddingBottom: "6px" }} {...props} />,
  h3: ({ node, ...props }: any) => <h3 style={{ fontSize: "18px", fontWeight: "bold", marginTop: "16px", marginBottom: "10px" }} {...props} />,
  h4: ({ node, ...props }: any) => <h4 style={{ fontSize: "16px", fontWeight: "bold", marginTop: "14px", marginBottom: "8px" }} {...props} />,
  h5: ({ node, ...props }: any) => <h5 style={{ fontSize: "14px", fontWeight: "bold", marginTop: "12px", marginBottom: "6px" }} {...props} />,
  h6: ({ node, ...props }: any) => <h6 style={{ fontSize: "12px", fontWeight: "bold", marginTop: "12px", marginBottom: "6px", color: "#777" }} {...props} />,
  p: ({ node, ...props }: any) => <p style={{ margin: "8px 0", lineHeight: "1.6" }} {...props} />,
  a: ({ node, ...props }: any) => <a style={{ color: "#0366d6", textDecoration: "none" }} {...props} />,
  ul: ({ node, ...props }: any) => <ul style={{ paddingLeft: "24px", margin: "8px 0" }} {...props} />,
  ol: ({ node, ...props }: any) => <ol style={{ paddingLeft: "24px", margin: "8px 0" }} {...props} />,
  li: ({ node, ...props }: any) => <li style={{ margin: "4px 0" }} {...props} />,
  blockquote: ({ node, ...props }: any) => <blockquote style={{ margin: "16px 0", padding: "0 16px", borderLeft: "4px solid #dfe2e5", color: "#6a737d" }} {...props} />,
  code: ({ node, ...props }: any) => <code style={{ padding: "2px 4px", backgroundColor: "#f6f8fa", borderRadius: "3px", fontFamily: "monospace", fontSize: "12px" }} {...props} />,
  pre: ({ node, ...props }: any) => <pre style={{ padding: "16px", backgroundColor: "#f6f8fa", borderRadius: "3px", overflow: "auto", fontFamily: "monospace", fontSize: "12px" }} {...props} />,
};

export default MDTPage;
