# AGENTS.md - Shiny Colors Stickers

> 为在此 React + Vite + Tailwind CSS 贴纸制作应用上工作的 AI 代理提供的指南。

## 项目概述

一个用于创建自定义 Shiny Colors（游戏）贴纸的 Web 应用，支持在角色图片上添加文字叠加层。

**技术栈**: React 18, Vite 7, Tailwind CSS 4, DaisyUI 5, Zustand 5, Canvas API

---

## 构建与开发命令

```bash
pnpm dev      # 开发服务器 (http://localhost:3000)
pnpm build    # 生产构建（输出到 ./build/）
pnpm preview  # 预览生产构建
pnpm deploy   # 部署到 GitHub Pages
```

**无测试配置** - 此项目没有测试套件。

---

## 项目结构

```
src/
├── App.jsx              # 主组件，编排 stores 和 effects
├── main.jsx             # React 入口点（含 StrictMode）
├── style/App.css        # 全局样式（Tailwind + DaisyUI）
├── stores/              # Zustand 状态管理
│   ├── useSettingsStore.js   # 贴纸设置（文字、颜色、效果）
│   ├── useCanvasStore.js     # Canvas 状态（角色、图片、种子）
│   └── useUIStore.js         # UI 状态（语言、字体加载、t()）
├── components/
│   ├── Canvas.jsx       # Canvas 包装器，处理异步绘制
│   ├── Display.jsx      # Canvas 显示，拖动移动，绘制逻辑
│   ├── Picker.jsx       # 角色选择下拉菜单
│   ├── Range.jsx        # 可复用的范围滑块组件
│   └── Info.jsx         # 关于对话框
├── utils/               # constants.js, config.js, log.js, preload.js
├── locales.jsx          # i18n 翻译（zh, en, ja）
├── characters.json      # 角色数据（图片、默认设置）
└── fonts/               # 自定义字体文件（.woff2）
```

---

## 代码风格指南

### 命名约定
- **组件**: PascalCase (`Display.jsx`)
- **Stores**: camelCase，带 `use` 前缀 (`useSettingsStore.js`)
- **工具/数据**: camelCase/lowercase (`config.js`, `characters.json`)

### 导入顺序
```jsx
// 1. React hooks  2. Zustand  3. 外部库  4. Stores  5. 组件  6. 数据  7. 工具  8. 样式
import { useEffect } from "react";
import { useShallow } from "zustand/shallow";
import useSettingsStore from "./stores/useSettingsStore";
import Display from "./components/Display";
import characters from "./characters.json";
import { CONSTANTS } from "./utils/constants";
import "./style/App.css";
```

### 格式化
- **缩进**: 2 空格  |  **引号**: 双引号  |  **分号**: 必需  |  **尾随逗号**: 是

### 状态管理（Zustand）

| Store | 用途 | 关键状态 |
|-------|------|---------|
| `useSettingsStore` | 贴纸配置 | text, x, y, colors, font, effects |
| `useCanvasStore` | Canvas 状态 | character, loadedImage, seed |
| `useUIStore` | UI 状态 | lang, fontsLoaded, snackbar, t() |

**用法示例**:
```jsx
// 使用 useShallow 防止不必要的重新渲染
const settings = useSettingsStore(useShallow((state) => ({
  text: state.text,
  font: state.font,
})));
const { updateSetting } = useSettingsStore();
const t = useUIStore((state) => state.t);
```

### 组件模式
```jsx
export default function ComponentName({ prop1, prop2 }) {
  const t = useUIStore((state) => state.t);
  const value = useSomeStore((state) => state.value);
  const { updateValue } = useSomeStore();

  useEffect(() => { /* ... */ }, [dependencies]);
  const handleSomething = (e) => { /* ... */ };

  return <div className="tailwind-classes">{/* content */}</div>;
}
```

### 样式
- **Tailwind CSS** 工具类 + **DaisyUI** 组件 (`btn`, `input`, `toggle` 等)
- **主题**: `caramellatte`（在 App.css 中定义）
- **自定义类**: 在 `src/style/App.css` 中使用 `@apply`

---

## React 最佳实践（关键！）

### useEffect 与异步操作
```jsx
// ✅ 正确：处理 cleanup 和 AbortController
useEffect(() => {
  const controller = new AbortController();
  
  const fetchData = async () => {
    try {
      const data = await someAsyncOperation(controller.signal);
      setState(data);
    } catch (err) {
      if (err.name !== 'AbortError') {  // 静默处理 AbortError
        console.error('Error:', err);
      }
    }
  };
  
  fetchData();
  return () => controller.abort();  // cleanup
}, [dependencies]);

// ❌ 错误：使用 isMounted 标志（反模式）
let isMounted = true;
if (isMounted) setState(data);  // 不要这样做！
```

### Strict Mode 处理
- **开发模式**：Effect 会执行两次（mount → unmount → mount）
- **不要**试图绕过或"修复"双重执行
- **要**确保 cleanup 函数正确取消异步操作
- **AbortError 是正常的**，应该被静默处理

### 字体加载模式
```jsx
// ✅ 幂等的字体加载（见 src/utils/preload.js）
- 重新抛出 AbortError 让上层处理
- 在 Effect 级别静默 AbortError
```

---

## Canvas 绘制

- **尺寸**: 296x256（来自 CONSTANTS）
- **绘制位置**: `Display.jsx` 的 `draw` 回调
- **两遍渲染**: 外部描边 → 内部描边 + 填充
- **性能优化**: 使用 `useDeferredValue` 防止快速更新时卡顿
- **异步处理**: `Canvas.jsx` 中正确等待异步 `draw` 函数

```jsx
// Canvas.jsx - 正确处理异步 draw
useEffect(() => {
  const render = async () => {
    await draw(context);  // 等待字体加载完成
  };
  render();
}, [draw]);
```

---

## 错误处理

### 分层错误处理模式
```jsx
// 1. 底层函数 - 重新抛出 AbortError
catch (error) {
  if (error.name === 'AbortError') throw error;
  console.error(error);
}

// 2. Promise 级别 - 继续传播
.catch((err) => {
  if (err.name === 'AbortError') throw err;
  console.error('Failed:', err);
})

// 3. Effect 级别 - 静默处理
catch (err) {
  if (err.name !== 'AbortError') {
    console.error('Error:', err);
  }
}
```

- try/catch 用于异步操作（API 调用、剪贴板）
- `console.error("上下文", error)` 用于日志记录
- 对关键失败使用用户友好的提示

---

## 国际化 (i18n)

```jsx
const t = useUIStore((state) => state.t);
// 用法: {t("copy")}
```
支持语言: `zh`（默认）、`en`、`ja`，定义在 `src/locales.jsx`

---

## 关键常量（src/utils/constants.js）

```js
CANVAS_WIDTH: 296, CANVAS_HEIGHT: 256
DEFAULT_FONT_SIZE: 50, DEFAULT_LINE_SPACING: 50
MITER_LIMIT: 2.5, CURVE_OFFSET_FACTOR: 3.5
```

---

## 代理注意事项

### 技术约束
1. **纯 JavaScript** - 无 TypeScript
2. **无测试套件** - 没有 `pnpm test` 命令
3. **Zustand 管理状态** - 不要对共享状态使用 useState，使用 stores
4. **Canvas 密集型** - `Display.jsx` 中的复杂绘制逻辑
5. **字体处理** - 通过 `preloadFont()` 加载自定义字体，关键字体会阻塞 UI
6. **GitHub Pages** - Base URL 是 `/shinycolors-stickers/`
7. **DaisyUI v5** - 使用新语法
8. **Tailwind CSS v4** - 使用 `@import "tailwindcss"` 语法，非 v3 配置

### 进行更改时
- 运行 `pnpm dev` 进行可视化测试
- 提交前运行 `pnpm build` 验证无构建错误
- 修改 Display.jsx 时检查 canvas 渲染
- 修改 locales.jsx 时测试所有三种语言
- 添加新状态时，添加到适当的 store（不是 useState）
- 修改异步逻辑时，确保正确处理 cleanup 和 AbortError

### 常见陷阱（避免！）
❌ 使用 `isMounted` 标志检查
❌ 在 useEffect 中不处理 cleanup
❌ 忽略 Strict Mode 的双重执行
❌ 在 Promise 中不处理 AbortError
❌ 对共享状态使用 useState 而不是 Zustand
❌ 在 Canvas 绘制函数中不使用 async/await

### 最佳实践（遵循！）
✅ 使用 AbortController 取消异步操作
✅ 在 cleanup 函数中取消 Effect
✅ 静默处理 AbortError（这是正常的 cleanup 行为）
✅ 使用 useShallow 优化 Zustand 性能
✅ 使用 useDeferredValue 优化 Canvas 性能
✅ 确保字体在绘制前加载完成

---

**最后更新**: 2026-01-16 - 添加了 React Strict Mode 和异步处理最佳实践
