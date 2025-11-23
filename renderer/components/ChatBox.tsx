import React, { useState, useRef, useEffect } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";

// Markdown库的状态变量
let ReactMarkdownLib: any = null;
let remarkGfmLib: any = null;
let SyntaxHighlighterLib: any = null;
let oneDarkLib: any = null;

/**
 * 聊天消息接口
 */
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  model?: string;
}

/**
 * AI模型接口
 */
interface AIModel {
  id: string;
  name: string;
  description: string;
}

/**
 * 聊天框组件
 */
const ChatBox: React.FC = () => {
  // 状态管理
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("deepseek");

  // 引用
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * 自动滚动到底部
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * 发送消息（使用 fetch-event-source 处理流式输出）
   */
  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    // 添加用户消息
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError("");

    // 创建空的助手消息
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      model: selectedModel,
    };
    setMessages((prev) => [...prev, assistantMessage]);

    // 创建 AbortController 用于取消请求
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let accumulatedContent = "";

    // 根据选择的模型确定 API 端点
    const apiEndpoint =
      selectedModel === "mistral"
        ? "http://localhost:3000/api/chat/stream/mistral"
        : "http://localhost:3000/api/chat/stream/deepseek";

    try {
      await fetchEventSource(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: userMessage.content,
          systemPrompt: "你是一个友好、专业的AI助手，用中文回答问题。",
        }),
        signal: abortController.signal,

        // 连接打开时触发
        onopen: async (response) => {
          if (response.ok) {
            console.log("✅ SSE 连接已建立");
            return; // 一切正常
          } else if (
            response.status >= 400 &&
            response.status < 500 &&
            response.status !== 429
          ) {
            // 客户端错误（4xx）- 不重试
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          } else {
            // 服务器错误或其他错误 - 抛出重试
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        },

        // 接收消息时触发
        onmessage: (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === "chunk" && data.content) {
              // 累积内容
              accumulatedContent += data.content;

              // 更新助手消息内容
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: accumulatedContent }
                    : msg
                )
              );
            } else if (data.type === "done") {
              console.log("✅ 流式传输完成:", data.stats);
            } else if (data.type === "error") {
              throw new Error(data.error);
            }
          } catch (e) {
            console.warn("解析消息失败:", event.data, e);
          }
        },

        // 连接关闭时触发
        onclose: () => {
          console.log("🔌 SSE 连接已关闭");
        },

        // 发生错误时触发
        onerror: (err) => {
          console.error("❌ SSE 错误:", err);

          // 如果是手动取消，不抛出错误
          if (err.name === "AbortError") {
            console.log("⚠️ 请求已取消");
            return;
          }

          // 抛出错误以便外层 catch 捕获
          throw err;
        },
      });
    } catch (err) {
      console.error("发送消息失败:", err);
      setError(
        `发送消息失败: ${err instanceof Error ? err.message : "未知错误"}`
      );

      // 更新助手消息显示错误
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: `抱歉，处理请求时发生错误。\n${
                  err instanceof Error ? err.message : "未知错误"
                }`,
              }
            : msg
        )
      );
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  /**
   * 取消生成
   */
  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
  };

  /**
   * 处理输入框键盘事件
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * 格式化时间
   */
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Load markdown dependencies when component mounts
  useEffect(() => {
    const loadMarkdownLibraries = async () => {
      try {
        const [
          reactMarkdownModule,
          remarkGfmModule,
          syntaxHighlighterModule,
          oneDarkThemeModule,
        ] = await Promise.all([
          import("react-markdown").catch(() => null),
          import("remark-gfm").catch(() => null),
          import("react-syntax-highlighter").catch(() => null) as Promise<any>,
          import(
            "react-syntax-highlighter/dist/esm/styles/prism/one-dark"
          ).catch(() =>
            import(
              "react-syntax-highlighter/dist/cjs/styles/prism/one-dark"
            ).catch(() => null)
          ) as Promise<any>,
        ]);

        if (reactMarkdownModule) ReactMarkdownLib = reactMarkdownModule.default;
        if (remarkGfmModule) remarkGfmLib = remarkGfmModule.default;
        if (syntaxHighlighterModule)
          SyntaxHighlighterLib = syntaxHighlighterModule.Prism;
        if (oneDarkThemeModule) oneDarkLib = oneDarkThemeModule.default;
      } catch (error) {
        console.warn("Failed to load markdown dependencies:", error);
      }
    };

    loadMarkdownLibraries();

    // Existing model fetching code
    const fetchModels = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/models");
        const data = await response.json();
        if (data.success && data.models) {
          setAvailableModels(data.models);
          // 设置默认模型
          if (data.default) {
            setSelectedModel(data.default);
          }
        }
      } catch (err) {
        console.error("获取模型列表失败:", err);
        // 如果获取失败，使用默认模型
        setAvailableModels([
          { id: "deepseek", name: "DeepSeek", description: "DeepSeek" },
          { id: "mistral", name: "Mistral", description: "Mistral AI" },
        ]);
      }
    };

    fetchModels();
  }, []);

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div></div>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          disabled={loading}
          className="model-select"
        >
          {availableModels.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
      </div>

      <div className="messages-container">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.role}`}>
            <div className="message-header">
              <span className="role">
                {message.role === "user" ? "你" : "AI"}
              </span>
              <span className="time">{formatTime(message.timestamp)}</span>
              {message.model && (
                <span className="model">({message.model})</span>
              )}
            </div>
            <div className="message-content">
              {message.role === "assistant" && ReactMarkdownLib
                ? React.createElement(ReactMarkdownLib, {
                    remarkPlugins: [remarkGfmLib],
                    children: message.content,
                    components: {
                      code({
                        node,
                        inline,
                        className,
                        children,
                        ...props
                      }: any) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline && match && SyntaxHighlighterLib
                          ? React.createElement(
                              SyntaxHighlighterLib,
                              {
                                style: oneDarkLib,
                                language: match[1],
                                PreTag: "div",
                                ...props,
                              },
                              String(children).replace(/\n$/, "")
                            )
                          : React.createElement(
                              "code",
                              { className, ...props },
                              children
                            );
                      },
                    },
                  })
                : message.content}
            </div>
          </div>
        ))}
        {error && <div className="error-message">{error}</div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入你的问题..."
          disabled={loading}
          rows={3}
        />
        <div className="input-actions">
          <span className="char-count">{input.length}</span>
          <div className="buttons">
            <button onClick={handleCancel} disabled={!loading}>
              取消
            </button>
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || loading}
            >
              发送
            </button>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .chat-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #f5f5f5;
        }

        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          background: white;
          border-bottom: 1px solid #e0e0e0;
        }

        .chat-header h2 {
          margin: 0;
          font-size: 18px;
          color: #333;
        }

        .model-select {
          padding: 8px 30px 8px 12px;
          border: 1px solid #ddd;
          border-radius: 20px;
          font-size: 14px;
          background-color: #f8f9fa;
          color: #333;
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 10px center;
          background-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 160px;
          text-align-last: center;
        }

        .model-select:hover:not(:disabled) {
          border-color: #3498db;
          background-color: #fff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .model-select:focus {
          outline: none;
          border-color: #3498db;
          box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
        }

        .model-select:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .message {
          max-width: 80%;
          padding: 12px 16px;
          border-radius: 8px;
          word-wrap: break-word;
        }

        .message.user {
          align-self: flex-end;
          background: #e3f2fd;
          border-top-right-radius: 2px;
        }

        .message.assistant {
          align-self: flex-start;
          background: linear-gradient(145deg, #f8f9fa, #ffffff);
          border: 1px solid #e9ecef;
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
          border-bottom-right-radius: 8px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
          transition: box-shadow 0.2s ease;
        }

        .message.assistant:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .message-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          font-size: 12px;
          color: #666;
        }

        .role {
          font-weight: 600;
        }

        .time {
          color: #999;
        }

        .model {
          color: #3498db;
          font-size: 11px;
        }

        .message-content {
          font-size: 15px;
          line-height: 1.6;
          color: #2c3e50;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
        }

        .loading-indicator {
          align-self: flex-start;
          padding: 10px 15px;
          background: #f0f0f0;
          border-radius: 8px;
          font-size: 14px;
          color: #666;
        }

        .error-message {
          align-self: center;
          padding: 12px 20px;
          background: #ffebee;
          color: #c62828;
          border-radius: 8px;
          font-size: 14px;
          margin: 10px 0;
        }

        .input-container {
          background: white;
          border-top: 1px solid #e0e0e0;
          padding: 15px 20px;
        }

        textarea {
          width: 100%;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 12px;
          font-size: 14px;
          resize: vertical;
          font-family: inherit;
          line-height: 1.4;
        }

        textarea:focus {
          outline: none;
          border-color: #3498db;
        }

        .input-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 10px;
        }

        .char-count {
          font-size: 12px;
          color: #999;
        }

        .buttons {
          display: flex;
          gap: 10px;
        }

        button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        button:first-child {
          background: #f0f0f0;
          color: #666;
        }

        button:first-child:hover:not(:disabled) {
          background: #e0e0e0;
        }

        button:last-child {
          background: #3498db;
          color: white;
        }

        button:last-child:hover:not(:disabled) {
          background: #2980b9;
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        /* Markdown 样式优化 */
        .message-content h1,
        .message-content h2,
        .message-content h3,
        .message-content h4,
        .message-content h5,
        .message-content h6 {
          margin: 16px 0 8px 0;
          font-weight: 600;
          line-height: 1.25;
        }

        .message-content h1 {
          font-size: 2em;
          border-bottom: 1px solid #eaecef;
          padding-bottom: 0.3em;
        }

        .message-content h2 {
          font-size: 1.5em;
          border-bottom: 1px solid #eaecef;
          padding-bottom: 0.3em;
        }

        .message-content h3 {
          font-size: 1.25em;
        }

        .message-content h4 {
          font-size: 1em;
        }

        .message-content p {
          margin: 8px 0;
          line-height: 1.6;
        }

        .message-content a {
          color: #3498db;
          text-decoration: none;
        }

        .message-content a:hover {
          text-decoration: underline;
        }

        .message-content strong {
          font-weight: 600;
        }

        .message-content em {
          font-style: italic;
        }

        .message-content del {
          text-decoration: line-through;
        }

        .message-content blockquote {
          margin: 16px 0;
          padding: 0 1em;
          color: #6a737d;
          border-left: 0.25em solid #dfe2e5;
        }

        .message-content ul,
        .message-content ol {
          padding-left: 2em;
          margin: 8px 0;
        }

        .message-content li {
          margin: 4px 0;
        }

        .message-content li > p {
          margin: 8px 0;
        }

        .message-content code {
          padding: 0.2em 0.4em;
          margin: 0;
          font-size: 85%;
          background-color: rgba(27, 31, 35, 0.05);
          border-radius: 3px;
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
        }

        .message-content pre {
          padding: 16px;
          overflow: auto;
          font-size: 85%;
          line-height: 1.45;
          background-color: #f6f8fa;
          border-radius: 3px;
          margin: 16px 0;
        }

        .message-content pre > code {
          padding: 0;
          margin: 0;
          font-size: 100%;
          word-break: normal;
          white-space: pre;
          background: transparent;
          border: 0;
        }

        .message-content hr {
          height: 0.25em;
          padding: 0;
          margin: 24px 0;
          background-color: #e1e4e8;
          border: 0;
        }

        .message-content table {
          display: block;
          width: 100%;
          overflow: auto;
          border-collapse: collapse;
          margin: 16px 0;
        }

        .message-content th {
          font-weight: 600;
        }

        .message-content td,
        .message-content th {
          padding: 6px 13px;
          border: 1px solid #dfe2e5;
        }

        .message-content tr:nth-child(2n) {
          background-color: #f6f8fa;
        }

        .message-content img {
          max-width: 100%;
          box-sizing: content-box;
        }
      `}} />
    </div>
  );
};

export default ChatBox;
