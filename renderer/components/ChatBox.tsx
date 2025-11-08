import React, { useState, useRef, useEffect } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';

/**
 * 聊天消息接口
 */
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
}

/**
 * AI 模型接口
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
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('mistral');

  // 引用
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * 自动滚动到底部
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
        const response = await fetch('http://localhost:3000/api/models');
        const data = await response.json();
        if (data.success && data.models) {
          setAvailableModels(data.models);
          // 设置默认模型
          if (data.default) {
            setSelectedModel(data.default);
          }
        }
      } catch (err) {
        console.error('获取模型列表失败:', err);
        // 如果获取失败，使用默认模型
        setAvailableModels([
          { id: 'mistral', name: 'Mistral', description: 'Mistral AI' },
          { id: 'deepseek', name: 'DeepSeek', description: 'DeepSeek' }
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
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    // 添加用户消息
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError('');

    // 创建空的助手消息
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      model: selectedModel
    };
    setMessages(prev => [...prev, assistantMessage]);

    // 创建 AbortController 用于取消请求
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let accumulatedContent = '';

    // 根据选择的模型确定 API 端点
    const apiEndpoint = selectedModel === 'mistral'
      ? 'http://localhost:3000/api/chat/stream/mistral'
      : 'http://localhost:3000/api/chat/stream/deepseek';

    try {
      await fetchEventSource(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: userMessage.content,
          systemPrompt: '你是一个友好、专业的AI助手，用中文回答问题。'
        }),
        signal: abortController.signal,

        // 连接打开时触发
        onopen: async (response) => {
          if (response.ok) {
            console.log('✅ SSE 连接已建立');
            return; // 一切正常
          } else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
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

            if (data.type === 'chunk' && data.content) {
              // 累积内容
              accumulatedContent += data.content;

              // 更新助手消息内容
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: accumulatedContent }
                    : msg
                )
              );
            } else if (data.type === 'done') {
              console.log('✅ 流式传输完成:', data.stats);
            } else if (data.type === 'error') {
              throw new Error(data.error);
            }
          } catch (e) {
            console.warn('解析消息失败:', event.data, e);
          }
        },

        // 连接关闭时触发
        onclose: () => {
          console.log('🔌 SSE 连接已关闭');
        },

        // 发生错误时触发
        onerror: (err) => {
          console.error('❌ SSE 错误:', err);

          // 如果是手动取消，不抛出错误
          if (err.name === 'AbortError') {
            console.log('⚠️ 请求已取消');
            return;
          }

          // 抛出错误以便外层 catch 捕获
          throw err;
        }
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('⚠️ 请求已取消');
      } else {
        console.error('❌ 发送消息失败:', err);
        setError(err.message || '发送消息失败，请重试');

        // 如果没有收到任何内容，移除失败的助手消息
        if (!accumulatedContent) {
          setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
        }
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  /**
   * 处理键盘事件
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * 取消当前请求
   */
  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  /**
   * 清空对话
   */
  const handleClear = () => {
    if (confirm('确定要清空所有对话吗？')) {
      setMessages([]);
      setError('');
    }
  };

  /**
   * 格式化时间
   */
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={styles.container}>
      {/* 头部 */}
      <div style={styles.header}>
        <h2 style={styles.title}>💬 AI 对话助手</h2>
        <div style={styles.headerActions}>
          {/* 模型选择器 */}
          <div style={styles.modelSelector}>
            <label style={styles.modelLabel}>🤖 模型:</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              style={styles.modelSelect}
              disabled={loading}
            >
              {availableModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleClear}
            style={styles.clearButton}
            disabled={messages.length === 0}
          >
            清空对话
          </button>
        </div>
      </div>

      {/* 消息列表 */}
      <div style={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🤖</div>
            <p style={styles.emptyText}>开始与 AI 对话吧！</p>
            <p style={styles.emptyHint}>输入你的问题，按 Enter 发送</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              style={{
                ...styles.messageWrapper,
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <div
                style={{
                  ...styles.message,
                  ...(message.role === 'user' ? styles.userMessage : styles.assistantMessage)
                }}
              >
                <div style={styles.messageHeader}>
                  <span style={styles.messageRole}>
                    {message.role === 'user' ? '👤 你' : '🤖 AI'}
                    {message.role === 'assistant' && message.model && (
                      <span style={styles.modelBadge}>
                        {availableModels.find(m => m.id === message.model)?.name || message.model}
                      </span>
                    )}
                  </span>
                  <span style={styles.messageTime}>{formatTime(message.timestamp)}</span>
                </div>
                <div style={styles.messageContent}>{message.content}</div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 错误提示 */}
      {error && (
        <div style={styles.errorBanner}>
          ⚠️ {error}
          <button onClick={() => setError('')} style={styles.errorClose}>
            ✕
          </button>
        </div>
      )}

      {/* 输入区域 */}
      <div style={styles.inputContainer}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
          style={styles.textarea}
          disabled={loading}
          rows={3}
        />
        <div style={styles.inputActions}>
          <div style={styles.inputHint}>
            {loading ? '正在发送...' : `${input.length} 字符`}
          </div>
          <div style={styles.buttonGroup}>
            {loading && (
              <button onClick={handleCancel} style={styles.cancelButton}>
                取消
              </button>
            )}
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || loading}
              style={{
                ...styles.sendButton,
                ...((!input.trim() || loading) && styles.sendButtonDisabled)
              }}
            >
              {loading ? '发送中...' : '发送'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 样式定义
 */
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#f5f7fa',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.5rem',
    backgroundColor: 'white',
    borderBottom: '1px solid #e0e0e0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  modelSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  modelLabel: {
    fontSize: '0.9rem',
    color: '#666',
    fontWeight: '500',
  },
  modelSelect: {
    padding: '0.5rem 0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '0.9rem',
    backgroundColor: 'white',
    cursor: 'pointer',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  modelBadge: {
    marginLeft: '0.5rem',
    padding: '0.2rem 0.5rem',
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    borderRadius: '4px',
    fontSize: '0.7rem',
    fontWeight: 'normal',
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    color: '#333',
  },
  clearButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'background-color 0.2s',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#999',
  },
  emptyIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
  },
  emptyText: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
  },
  emptyHint: {
    fontSize: '0.9rem',
    color: '#bbb',
  },
  messageWrapper: {
    display: 'flex',
    width: '100%',
  },
  message: {
    maxWidth: '70%',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  },
  userMessage: {
    backgroundColor: '#2196F3',
    color: 'white',
  },
  assistantMessage: {
    backgroundColor: 'white',
    color: '#333',
  },
  messageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
    fontSize: '0.85rem',
    opacity: 0.8,
  },
  messageRole: {
    fontWeight: 'bold',
  },
  messageTime: {
    fontSize: '0.75rem',
  },
  messageContent: {
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  errorBanner: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '0.75rem 1rem',
    margin: '0 1rem',
    borderRadius: '4px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.9rem',
  },
  errorClose: {
    background: 'none',
    border: 'none',
    color: '#c62828',
    cursor: 'pointer',
    fontSize: '1.2rem',
    padding: 0,
  },
  inputContainer: {
    backgroundColor: 'white',
    borderTop: '1px solid #e0e0e0',
    padding: '1rem',
  },
  textarea: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    resize: 'none',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  inputActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '0.5rem',
  },
  inputHint: {
    fontSize: '0.85rem',
    color: '#999',
  },
  buttonGroup: {
    display: 'flex',
    gap: '0.5rem',
  },
  cancelButton: {
    padding: '0.5rem 1.5rem',
    backgroundColor: '#ff9800',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'background-color 0.2s',
  },
  sendButton: {
    padding: '0.5rem 1.5rem',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'background-color 0.2s',
  },
  sendButtonDisabled: {
    backgroundColor: '#cccccc',
    cursor: 'not-allowed',
  },
};

export default ChatBox;
