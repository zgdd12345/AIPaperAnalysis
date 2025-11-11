/**
 * 关键词云（使用原生DOM绘制）
 */

import type { KeywordData } from "../aggregator";

export interface DisposableChart {
  dispose(): void;
}

export type KeywordSelectHandler = (keyword: string) => void;

export class KeywordCloudChart {
  render(
    container: HTMLElement,
    data: KeywordData[],
    onSelect?: KeywordSelectHandler,
  ): DisposableChart {
    if (!container) {
      throw new Error("Keyword container not found");
    }

    container.innerHTML = "";
    container.style.display = "flex";
    container.style.flexWrap = "wrap";
    container.style.alignItems = "center";
    container.style.gap = "8px";

    const maxFreq = Math.max(...data.map((item) => item.frequency));
    const minFreq = Math.min(...data.map((item) => item.frequency));
    const fontRange = { min: 12, max: 32 };

    const ownerDocument = container.ownerDocument;
    if (!ownerDocument) {
      throw new Error("Missing document for keyword container");
    }

    const fragment = ownerDocument.createDocumentFragment();

    const disposers: Array<() => void> = [];

    data.slice(0, 50).forEach((keyword, index) => {
      const span = ownerDocument.createElement("span");
      const weight =
        maxFreq === minFreq
          ? 1
          : (keyword.frequency - minFreq) / (maxFreq - minFreq);
      const fontSize = fontRange.min + weight * (fontRange.max - fontRange.min);

      span.textContent = keyword.word;
      span.style.fontSize = `${fontSize}px`;
      span.style.fontWeight = weight > 0.6 ? "600" : "400";
      span.style.color = this.pickColor(index);
      span.title = `${keyword.word}: ${keyword.frequency}`;
      if (onSelect) {
        span.style.cursor = "pointer";
        const handler = () => onSelect(keyword.word);
        span.addEventListener("click", handler);
        disposers.push(() => span.removeEventListener("click", handler));
      }

      fragment.appendChild(span);
    });

    container.appendChild(fragment);

    return {
      dispose: () => {
        disposers.forEach((dispose) => dispose());
        container.innerHTML = "";
      },
    };
  }

  private pickColor(index: number): string {
    const palette = ["#5470c6", "#91cc75", "#fac858", "#ee6666", "#73c0de"];
    return palette[index % palette.length];
  }
}
