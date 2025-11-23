/**
 * 调用大模型接口分析Performance数据
 * @param performanceData Performance API数据
 * @returns 分析结果的Promise
 */
export const analyzeWebVitalsWithLLM = async (performanceData: any): Promise<string> => {
  try {
    const prompt = `
请分析以下Performance API性能数据：

指标数据：
${JSON.stringify(performanceData, null, 2)}

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
    return `基于采集的Performance API指标分析：

Navigation Timing: ${performanceData.navigation ? 'Available' : 'N/A'}
Timing Data: ${performanceData.timing ? 'Available' : 'N/A'}
Memory Info: ${performanceData.memory ? 'Available' : 'N/A'}
Paint Entries: ${performanceData.paint ? performanceData.paint.length : 0} items
Performance Entries: ${performanceData.entries ? performanceData.entries.length : 0} items

优化建议：
1. 检查页面加载时间，优化关键资源加载
2. 分析首屏渲染时间，优化关键渲染路径
3. 检查内存使用情况，避免内存泄漏
4. 优化资源加载顺序和并行度`;
  }
};