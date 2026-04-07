# Studio 浅色高阶工作台 UI 改造 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `studio` 工作台升级为浅色高阶控制台风格，并保持现有业务逻辑与阶段行为不变。

**Architecture:** 改造集中在 `ProjectStudioPage` 与 `studio` 壳层组件，通过统一 header、阶段导航、页面骨架和右栏卡片语言来提升整体质感。业务数据仍由 `useProjectStudio` 提供，现有各阶段业务组件保持接口不变，只增强上层表现层和摘要信息。

**Tech Stack:** React、TypeScript、Tailwind、Vitest、Testing Library、21st magic MCP

---

## 文件结构与职责

- 修改 `frontend/src/pages/ProjectStudioPage.tsx`
  - 组装新的 header 摘要数据
  - 向壳层组件传递更完整的显示信息
- 修改 `frontend/src/components/studio/StudioHeader.tsx`
  - 实现浅色英雄区与阶段状态摘要
- 修改 `frontend/src/components/studio/StudioStageNav.tsx`
  - 实现更强层次的流程卡片导航
- 修改 `frontend/src/components/studio/StudioShell.tsx`
  - 调整页面整体背景、间距和右侧控制台轨道结构
- 修改 `frontend/src/components/studio/StudioHealthChecklist.tsx`
  - 统一为浅色控制台卡片样式
- 修改 `frontend/src/components/studio/StudioInspector.tsx`
  - 统一为浅色控制台卡片样式
- 修改 `frontend/src/components/studio/StudioTaskCenter.tsx`
  - 统一为浅色控制台卡片样式
- 修改 `frontend/src/components/studio/__tests__/StudioShell.test.tsx`
  - 为新的壳层结构补测试
- 修改 `frontend/src/components/studio/__tests__/StudioStageNav.test.tsx`
  - 为新的阶段导航展示补测试
- 修改 `frontend/src/pages/__tests__/ProjectStudioPage.test.tsx`
  - 为新的 header / 摘要展示补测试

## Chunk 1: 测试先行定义新壳层输出

### Task 1: 更新页面与导航测试

**Files:**
- Modify: `frontend/src/components/studio/__tests__/StudioStageNav.test.tsx`
- Modify: `frontend/src/components/studio/__tests__/StudioShell.test.tsx`
- Modify: `frontend/src/pages/__tests__/ProjectStudioPage.test.tsx`

- [ ] **Step 1: 写出针对新视觉结构的失败测试**
- [ ] **Step 2: 运行相关测试并确认失败原因符合预期**
- [ ] **Step 3: 保持业务行为不变的前提下实现新的结构与文案**
- [ ] **Step 4: 重新运行相关测试并确认通过**

## Chunk 2: 实现 studio 浅色高阶壳层

### Task 2: 实现浅色英雄区与工作台摘要

**Files:**
- Modify: `frontend/src/components/studio/StudioHeader.tsx`
- Modify: `frontend/src/pages/ProjectStudioPage.tsx`
- Test: `frontend/src/pages/__tests__/ProjectStudioPage.test.tsx`

- [ ] **Step 1: 先让 header 新摘要和新文案在测试中失败**
- [ ] **Step 2: 实现浅色英雄区、阶段状态卡与摘要信息**
- [ ] **Step 3: 运行页面测试确认 header 变更通过**

### Task 3: 实现阶段导航与页面骨架升级

**Files:**
- Modify: `frontend/src/components/studio/StudioStageNav.tsx`
- Modify: `frontend/src/components/studio/StudioShell.tsx`
- Test: `frontend/src/components/studio/__tests__/StudioStageNav.test.tsx`
- Test: `frontend/src/components/studio/__tests__/StudioShell.test.tsx`

- [ ] **Step 1: 让新的导航结构断言先失败**
- [ ] **Step 2: 实现流程感更强的浅色导航卡与工作台骨架**
- [ ] **Step 3: 运行组件测试确认通过**

### Task 4: 统一右栏控制台卡片语言

**Files:**
- Modify: `frontend/src/components/studio/StudioHealthChecklist.tsx`
- Modify: `frontend/src/components/studio/StudioInspector.tsx`
- Modify: `frontend/src/components/studio/StudioTaskCenter.tsx`

- [ ] **Step 1: 基于现有内容结构保持语义不变，仅调整卡片层次与状态标签表达**
- [ ] **Step 2: 检查页面测试是否需要补充断言**
- [ ] **Step 3: 运行相关页面测试确认右栏改造未破坏现有行为**

## Chunk 3: 验证与收尾

### Task 5: 执行定向验证

**Files:**
- Test: `frontend/src/components/studio/__tests__/StudioShell.test.tsx`
- Test: `frontend/src/components/studio/__tests__/StudioStageNav.test.tsx`
- Test: `frontend/src/pages/__tests__/ProjectStudioPage.test.tsx`

- [ ] **Step 1: 运行 studio 相关测试文件**
- [ ] **Step 2: 如有失败，修正最小必要改动并回归**
- [ ] **Step 3: 记录验证结果与剩余风险**

Plan complete and saved to `docs/superpowers/plans/2026-04-07-studio-light-premium-ui.md`. Ready to execute?
