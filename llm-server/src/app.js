// Express 服务器 - 处理 AI 流式响应请求
import express from "express";
import cors from "cors";
import { deepseek, mistral, getLLM, getAvailableModels } from "./llm.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import multer from "multer";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

// 在ES模块中创建__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 创建 Express 应用
const app = express();
const PORT = process.env.PORT || 3000;
const execPromise = promisify(exec);

// 配置文件上传
const upload = multer({
  dest: path.join(__dirname, "../../sg-scripts/temp/"),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/tiff",
      "image/bmp",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("不支持的文件类型"), false);
    }
  },
});

// 中间件配置
app.use(cors()); // 允许跨域请求
app.use(express.json()); // 解析 JSON 请求体
app.use(express.urlencoded({ extended: true })); // 解析 URL 编码的请求体

/**
 * POST /stream/mistral - 使用 Mistral 流式返回 AI 响应
 * 请求体: { prompt: string, systemPrompt?: string }
 */
app.post("/api/chat/stream/mistral", async (req, res) => {
  try {
    const { prompt, systemPrompt } = req.body;

    // 验证请求参数
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        error: "缺少必需参数 prompt 或参数类型错误",
      });
    }

    // 设置响应头为流式传输
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    console.log(
      `[${new Date().toISOString()}] [Mistral] 收到流式请求: ${prompt.substring(
        0,
        50
      )}...`
    );

    // 构建消息数组
    const messages = [];
    if (systemPrompt) {
      messages.push(new SystemMessage(systemPrompt));
    }
    messages.push(new HumanMessage(prompt));

    // 调用 Mistral 流式 API
    const stream = await mistral.stream(messages);

    let chunkCount = 0;
    let totalChars = 0;

    // 流式返回每个 chunk
    for await (const chunk of stream) {
      const content = chunk.content || "";

      if (content) {
        chunkCount++;
        totalChars += content.length;

        // 发送 SSE 格式的数据
        res.write(
          `data: ${JSON.stringify({
            content,
            type: "chunk",
          })}\n\n`
        );
      }
    }

    // 发送完成信号
    res.write(
      `data: ${JSON.stringify({
        type: "done",
        stats: {
          chunks: chunkCount,
          totalChars,
          model: "mistral",
        },
      })}\n\n`
    );

    console.log(
      `[${new Date().toISOString()}] [Mistral] 流式响应完成: ${chunkCount} chunks, ${totalChars} 字符`
    );

    res.end();
  } catch (error) {
    console.error("[Mistral 错误] 流式响应失败:", error);

    if (!res.headersSent) {
      res.status(500).json({
        error: "服务器内部错误",
        message: error.message,
      });
    } else {
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          error: error.message,
        })}\n\n`
      );
      res.end();
    }
  }
});

/**
 * POST /api/chat/stream - 流式返回 AI 响应
 * 请求体: { prompt: string, systemPrompt?: string }
 */
app.post("/api/chat/stream/deepseek", async (req, res) => {
  try {
    const { prompt, systemPrompt } = req.body;

    // 验证请求参数
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        error: "缺少必需参数 prompt 或参数类型错误",
      });
    }

    // 设置响应头为流式传输
    res.setHeader("Content-Type", "text/event-stream"); // 使用 Server-Sent Events
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // 禁用 Nginx 缓冲

    console.log(
      `[${new Date().toISOString()}] 收到流式请求: ${prompt.substring(
        0,
        50
      )}...`
    );

    // 构建消息数组
    const messages = [];
    if (systemPrompt) {
      messages.push(new SystemMessage(systemPrompt));
    }
    messages.push(new HumanMessage(prompt));

    // 调用 DeepSeek 流式 API
    const stream = await deepseek.stream(messages);

    let chunkCount = 0;
    let totalChars = 0;

    // 流式返回每个 chunk
    for await (const chunk of stream) {
      const content = chunk.content || "";

      if (content) {
        chunkCount++;
        totalChars += content.length;

        // 发送 SSE 格式的数据
        res.write(
          `data: ${JSON.stringify({
            content,
            type: "chunk",
          })}\n\n`
        );
      }
    }

    // 发送完成信号
    res.write(
      `data: ${JSON.stringify({
        type: "done",
        stats: {
          chunks: chunkCount,
          totalChars,
        },
      })}\n\n`
    );

    console.log(
      `[${new Date().toISOString()}] 流式响应完成: ${chunkCount} chunks, ${totalChars} 字符`
    );

    // 结束响应
    res.end();
  } catch (error) {
    console.error("[错误] 流式响应失败:", error);

    // 如果响应头还未发送，返回错误信息
    if (!res.headersSent) {
      res.status(500).json({
        error: "服务器内部错误",
        message: error.message,
      });
    } else {
      // 如果已经开始流式传输，发送错误事件
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          error: error.message,
        })}\n\n`
      );
      res.end();
    }
  }
});

/**
 * POST /api/chat - 非流式返回 AI 响应
 * 请求体: { prompt: string, systemPrompt?: string }
 */
app.post("/api/chat", async (req, res) => {
  try {
    const { prompt, systemPrompt } = req.body;

    // 验证请求参数
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        error: "缺少必需参数 prompt 或参数类型错误",
      });
    }

    console.log(
      `[${new Date().toISOString()}] 收到请求: ${prompt.substring(0, 50)}...`
    );

    // 构建消息数组
    const messages = [];
    if (systemPrompt) {
      messages.push(new SystemMessage(systemPrompt));
    }
    messages.push(new HumanMessage(prompt));

    // 调用 DeepSeek API
    const response = await deepseek.invoke(messages);

    console.log(
      `[${new Date().toISOString()}] 响应完成: ${response.content.length} 字符`
    );

    // 返回完整响应
    res.json({
      success: true,
      content: response.content,
      length: response.content.length,
    });
  } catch (error) {
    console.error("[错误] 请求失败:", error);
    res.status(500).json({
      error: "服务器内部错误",
      message: error.message,
    });
  }
});

/**
 * GET /api/models - 获取可用模型列表
 */
app.get("/api/models", (req, res) => {
  try {
    const models = getAvailableModels();
    res.json({
      success: true,
      models,
      default: "deepseek",
    });
  } catch (error) {
    console.error("[错误] 获取模型列表失败:", error);
    res.status(500).json({
      error: "服务器内部错误",
      message: error.message,
    });
  }
});

/**
 * GET /health - 健康检查接口
 */
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "DeepSeek AI Server",
  });
});

/**
 * GET / - 根路径，返回 API 文档
 */
app.get("/", (req, res) => {
  res.json({
    name: "DeepSeek AI API Server",
    version: "1.0.0",
    endpoints: {
      "POST /api/chat/stream": "流式返回 AI 响应 (Server-Sent Events)",
      "POST /api/chat": "非流式返回 AI 响应",
      "GET /health": "健康检查",
    },
    example: {
      stream: {
        url: "/api/chat/stream",
        method: "POST",
        body: {
          prompt: "你的问题",
          systemPrompt: "系统提示（可选）",
        },
      },
      chat: {
        url: "/api/chat",
        method: "POST",
        body: {
          prompt: "你的问题",
          systemPrompt: "系统提示（可选）",
        },
      },
    },
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log("=".repeat(60));
  console.log(`🚀 DeepSeek AI 服务器已启动`);
  console.log(`📡 监听端口: ${PORT}`);
  console.log(`🌐 访问地址: http://localhost:${PORT}`);
  console.log(`📚 API 文档: http://localhost:${PORT}`);
  console.log(`💊 健康检查: http://localhost:${PORT}/health`);
  console.log("=".repeat(60));
});

// 优雅关闭
process.on("SIGTERM", () => {
  console.log("\n🛑 收到 SIGTERM 信号，正在关闭服务器...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n🛑 收到 SIGINT 信号，正在关闭服务器...");
  process.exit(0);
});

export default app;

// 修改upload-to-shotgrid端点中的路径处理
app.post(
  "/api/upload-to-shotgrid",
  upload.single("image"),
  async (req, res) => {
    const cleanupFile = (filePath) => {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.warn("清理临时文件失败:", e);
      }
    };

    try {
      const { assetName, assetType, versionName } = req.body;
      const imageFile = req.file;

      // 校验参数
      if (!imageFile)
        return res
          .status(400)
          .json({ success: false, error: "请上传图片文件" });
      if (!assetName || typeof assetName !== "string")
        return res
          .status(400)
          .json({ success: false, error: "缺少有效的资产名称" });

      // 重命名文件保留扩展名
      const imageExt = path.extname(imageFile.originalname);
      const newImagePath = `${imageFile.path}${imageExt}`;
      fs.renameSync(imageFile.path, newImagePath);

      // 构建Python命令参数
      const sgScriptsDir = path.join(__dirname, "../../sg-scripts");
      const sgScript = path.join("src", "sg.py");
      const args = [
        "-m",
        "poetry",
        "run",
        "python",
        sgScript,
        "upload",
        newImagePath,
        assetName,
      ];
      if (versionName) args.push(versionName);
      args.push(assetType || "Prop");

      console.log("执行命令:", "python", args.join(" "));

      // 执行Python脚本
      const result = await new Promise((resolve, reject) => {
        const child = spawn("python", args, {
          cwd: sgScriptsDir,
          stdio: ["ignore", "pipe", "pipe"],
          env: {
            ...process.env,
            PYTHONIOENCODING: "utf-8",
            PYTHONLEGACYWINDOWSCONSOLE: "1",
          },
        });

        let stdout = "";
        let stderr = "";

        child.stdout.on("data", (data) => {
          stdout += data.toString();
        });
        child.stderr.on("data", (data) => {
          stderr += data.toString();
        });

        child.on("error", (err) => reject(err));
        child.on("close", (code) => {
          if (code === 0) {
            try {
              resolve(JSON.parse(stdout.trim()));
            } catch (e) {
              reject(
                new Error(
                  `解析Python输出失败: ${e.message}, stdout: ${stdout}, stderr: ${stderr}`
                )
              );
            }
          } else {
            reject(new Error(`Python脚本退出码 ${code}, stderr: ${stderr}`));
          }
        });
      });

      // 清理临时文件
      cleanupFile(newImagePath);

      return res.json(result);
    } catch (error) {
      console.error("上传到ShotGrid失败:", error);

      // 清理可能的临时文件
      if (req.file) {
        const imageExt = path.extname(req.file.originalname);
        const newImagePath = `${req.file.path}${imageExt}`;
        cleanupFile(newImagePath);
      }

      return res.status(500).json({
        success: false,
        error: error.message || "服务器内部错误",
      });
    }
  }
);
