/**
 * 关键词云（使用原生DOM绘制）
 */
import type { KeywordData } from "../aggregator";
export interface DisposableChart {
  dispose(): void;
}
export type KeywordSelectHandler = (keyword: string) => void;
export declare class KeywordCloudChart {
  render(
    container: HTMLElement,
    data: KeywordData[],
    onSelect?: KeywordSelectHandler,
  ): DisposableChart;
  private pickColor;
}
