import { onCLS, onFCP, onLCP, onTTFB } from "web-vitals";
import { throttle } from "lodash";

export interface WebVitalsData {
  cls?: any;
  fcp?: any;
  lcp?: any;
  ttfb?: any;
}

export type WebVitalsCallback = (data: WebVitalsData) => void;

/**
 * 采集Web Vitals指标
 * @param callback 回调函数，接收采集到的指标数据
 */
export const collectWebVitals = throttle(
  (callback: WebVitalsCallback): void => {
    const vitalsData: WebVitalsData = {};

    const handleMetric = (metric: any) => {
      switch (metric.name) {
        case "CLS":
          vitalsData.cls = metric;
          break;
        case "FCP":
          vitalsData.fcp = metric;
          break;
        case "LCP":
          vitalsData.lcp = metric;
          break;
        case "TTFB":
          vitalsData.ttfb = metric;
          break;
      }

      // 当所有指标都收集完毕时调用回调
      if (Object.keys(vitalsData).length === 4) {
        callback(vitalsData);
      }
    };

    // 采集各项web-vitals指标
    onCLS(handleMetric);
    onFCP(handleMetric);
    onLCP(handleMetric);
    onTTFB(handleMetric);
  },
  2000
);