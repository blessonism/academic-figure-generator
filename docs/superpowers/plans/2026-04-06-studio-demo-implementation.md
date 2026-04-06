# Studio Demo Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 交付一个独立的 `/studio-demo` 半交互页面，用 mock 数据验证新版 Studio 的页面骨架和交互节奏。

**Architecture:** 采用“页面容器 + Demo 状态 hook + 分阶段局部组件”的结构。保留现有正式 Studio 页面不动，通过新增 demo route 与 mock 状态隔离设计实验，同时为后续正式重构复用结构边界。

**Tech Stack:** React 19、React Router、TypeScript、Tailwind、Vitest、Testing Library

---

## Chunk 1: 文档与测试先行

### Task 1: 为 Studio Demo 写页面测试

**Files:**
- Create: `frontend/src/pages/__tests__/StudioDemoPage.test.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: 写 3 个失败测试**
  - 默认进入 Scope 阶段并展示范围确认主区
  - 点击阶段导航切换到 Prompt 阶段并更新上下文摘要
  - 修改 Prompt 决策后展示底部动作条，保存后动作条消失

- [ ] **Step 2: 运行测试，确认失败**

Run: `npm --prefix frontend run test -- --run frontend/src/pages/__tests__/StudioDemoPage.test.tsx`

- [ ] **Step 3: 根据失败信息校准组件 API**

---

## Chunk 2: Demo 页面骨架

### Task 2: 新增 Demo 页面与局部状态

**Files:**
- Create: `frontend/src/pages/StudioDemoPage.tsx`
- Create: `frontend/src/studio-demo/useStudioDemoState.ts`
- Create: `frontend/src/studio-demo/mockData.ts`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: 定义 Demo 用阶段状态与 mock 数据**
- [ ] **Step 2: 实现页面级容器与路由 `/studio-demo`**
- [ ] **Step 3: 接入 Header、阶段导航、主工作区、上下文面板、动作条占位**
- [ ] **Step 4: 运行测试，确认至少能渲染默认阶段**

---

## Chunk 3: 关键半交互体验

### Task 3: 实现阶段导航、上下文面板与底部动作条

**Files:**
- Create: `frontend/src/components/studio-demo/StudioDemoHeader.tsx`
- Create: `frontend/src/components/studio-demo/StudioDemoStageFlow.tsx`
- Create: `frontend/src/components/studio-demo/StudioDemoContextPanel.tsx`
- Create: `frontend/src/components/studio-demo/StudioDemoActionDock.tsx`
- Create: `frontend/src/components/studio-demo/StudioDemoCompletionCard.tsx`
- Create: `frontend/src/components/studio-demo/stages/ScopeDemoStage.tsx`
- Create: `frontend/src/components/studio-demo/stages/PromptDemoStage.tsx`
- Create: `frontend/src/components/studio-demo/stages/RenderDemoStage.tsx`

- [ ] **Step 1: 实现阶段切换与展开式阶段导航**
- [ ] **Step 2: 实现上下文面板切换与阶段摘要内容**
- [ ] **Step 3: 实现 Scope / Prompt / Render 三阶段主区交互**
- [ ] **Step 4: 实现底部动作条与阶段完成卡**
- [ ] **Step 5: 运行测试，确认交互全部变绿**

---

## Chunk 4: 收尾验证

### Task 4: 补齐展示细节并完成验证

**Files:**
- Modify: `frontend/src/pages/StudioDemoPage.tsx`
- Modify: `frontend/src/components/studio-demo/*`

- [ ] **Step 1: 校整文案、状态标签、留白与层级**
- [ ] **Step 2: 运行 `npm --prefix frontend run test -- --run`**
- [ ] **Step 3: 运行 `npm --prefix frontend run build`**
- [ ] **Step 4: 若无问题，整理给用户的访问路径与评审说明**
