# PDF 查看器演示 (PDF Viewer Demo)

基于 pdfjs-dist 的 React PDF 预览功能技术演示  
Technology demo of PDF viewer implementation using React and pdfjs-dist

> ⚠️ 注意：此为教学演示代码片段，非完整可运行项目  
> ⚠️ Note: This is educational demo code, not a runnable project

## 演示功能 (Demo Features)

▸ 多页模式预览实现 | Multi-page preview implementation  
▸ 核心缩放逻辑示例 | Core zoom logic demonstration  
▸ 搜索功能基础实现 | Basic search functionality  
▸ 缩略图组件示例 | Thumbnail component example  
▸ 状态管理集成演示 | State management integration

## 代码结构 (Code Structure)

```bash
/pdfViewer
├── component/
│   ├── PdfRender.tsx    # 主查看器组件 Main viewer component
│   ├── PdfThumbnail.tsx # 缩略图组件 Thumbnail component
│   └── pdfType.ts       # 类型定义 Type definitions
```

## 核心代码片段 (Core Code Snippet)

```ts
import PdfRender from "./component/PdfRender";

function App() {
    return (
        <div className="viewer-container">
            <PdfRender pdfUrl="/sample.pdf" />
        </div>
    );
}
```

```ts
const pdfViewer = new PDFViewer({
    container: divElement,
    eventBus: new EventBus(),
    textLayerMode: 1,
});

// highlight
eventBus.dispatch("find", {
    query: searchText,
    caseSensitive: true,
    highlightAll: true,
});
```

```TS
// PDF文档加载示例 | Document loading demo
const initPdfViewer = async (url: string) => {
  const pdf = await pdfjs.getDocument(url).promise;
  pdfViewer.setDocument(pdf);
}
```

```TS
// 基于光标位置的缩放逻辑 | Cursor-based zoom logic
const handleWheel = (e: WheelEvent) => {
  if (e.ctrlKey) {
    // 计算缩放后滚动位置 | Calculate post-zoom scroll position
    const newZoom = e.deltaY < 0 ? oldZoom + 0.05 : oldZoom - 0.05;
    viewer.currentScale = newZoom;
  }
}

```
