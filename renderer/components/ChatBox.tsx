import React, { useState, useRef, useEffect } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";

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
   * 加载可用模型
   */
  useEffect(() => {
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
      setError(`发送消息失败: ${err instanceof Error ? err.message : "未知错误"}`);

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
            <div className="message-content">{message.content}</div>
          </div>
        ))}
        {loading && (
          <div className="loading-indicator">
            <span>生成中...</span>
          </div>
        )}
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

      <style jsx>{`
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
          min-width: 120px;
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
          background: white;
          border: 1px solid #e0e0e0;
          border-top-left-radius: 2px;
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
          line-height: 1.5;
          color: #333;
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
      `}</style>
    </div>
  );
};

export default ChatBox;
