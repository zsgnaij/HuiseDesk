import { WebVitalsData } from './webVitalsCollector';

/**
 * 调用大模型接口分析Web Vitals数据
 * @param webVitalsData Web Vitals指标数据
 * @returns 分析结果的Promise
 */
export const analyzeWebVitalsWithLLM = async (webVitalsData: WebVitalsData): Promise<string> => {
  try {
    const prompt = `
请分析以下Web Vitals性能指标数据：

指标数据：
${JSON.stringify(webVitalsData, null, 2)}

请根据这些数据提供性能分析和优化建议，请用中文回答。
`;

    // 调用本地LLM服务器的DeepSeek接口
    const response = await fetch('http://localhost:3000/api/chat/deepseek', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      return result.content;
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('LLM分析失败:', error);
    // 使用模拟分析结果作为备选
    return `基于采集的Web Vitals指标分析：

CLS (累积布局偏移): ${webVitalsData.cls?.value?.toFixed(4) || 'N/A'}
FCP (首次内容绘制): ${webVitalsData.fcp?.value?.toFixed(2) || 'N/A'} ms
LCP (最大内容绘制): ${webVitalsData.lcp?.value?.toFixed(2) || 'N/A'} ms
TTFB (首字节时间): ${webVitalsData.ttfb?.value?.toFixed(2) || 'N/A'} ms

优化建议：
1. 如果LCP值较高，考虑优化图片加载和代码分割
2. 如果CLS值较高，检查是否有动态内容插入导致布局偏移
3. 如果FCP值较高，优化关键渲染路径
4. 如果TTFB值较高，考虑使用CDN或优化服务器响应`;
  }
};