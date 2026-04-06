# Studio V2 Rollout Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将正式 `/projects/:id` Studio 页面升级为采用 V2 设计语言的五阶段专业工作台，同时保持现有真实数据链路和关键交互可用。

**Architecture:** 继续以 `useProjectStudio` 作为唯一真实状态源，在 `frontend/src/studio/` 补充视图派生层，把页面摘要、阶段轨道和右侧专业面板从页面 JSX 中剥离出来。页面壳层改造成 V2 风格的正式工作台，五个阶段组件按“专业判断面板”模式逐步重构，并通过正式页回归测试保障迁移安全。

**Tech Stack:** React 19、React Router、TypeScript、Tailwind、Vitest、Testing Library

---

## 文件结构与职责

### 页面与状态入口

- Modify: `frontend/src/pages/ProjectStudioPage.tsx`
  - 将正式页改造成 V2 风格的正式工作台入口
- Modify: `frontend/src/studio/useProjectStudio.ts`
  - 仅在确有需要时补充正式页所需的派生数据或动作，不重写状态机

### Studio 视图派生层

- Modify: `frontend/src/studio/types.ts`
  - 补充页面壳层、阶段轨道、摘要面板所需类型
- Modify: `frontend/src/studio/selectors.ts`
  - 新增正式页阶段轨道、阶段摘要、右侧指标等视图派生逻辑
- Modify: `frontend/src/studio/constants.ts`
  - 补充五阶段目标说明、阶段副标题等静态文案

### 页面壳层与通用组件

- Modify: `frontend/src/components/studio/StudioHeader.tsx`
  - 升级为更接近 V2 的正式页头部
- Modify: `frontend/src/components/studio/StudioStageNav.tsx`
  - 升级为阶段轨道式导航
- Modify: `frontend/src/components/studio/StudioShell.tsx`
  - 从旧三栏壳层改为正式 V2 工作台壳层
- Create or Modify: `frontend/src/components/studio/StudioInspector.tsx`
  - 转型为右侧专业摘要面板
- Modify or Remove usage: `frontend/src/components/studio/StudioHealthChecklist.tsx`
  - 若保留则弱化为内联就绪卡，否则其语义迁入摘要面板或阶段内
- Modify or Remove usage: `frontend/src/components/studio/StudioTaskCenter.tsx`
  - 若保留则仅作为阶段内状态卡，不再作为页面底部固定区块

### 五阶段组件

- Modify: `frontend/src/components/studio/stages/IngestStage.tsx`
  - 改造成输入准备工作台
- Modify: `frontend/src/components/studio/stages/ScopeStage.tsx`
  - 改造成范围确认工作台
- Modify: `frontend/src/components/studio/stages/PromptStage.tsx`
  - 改造成草案评审工作台
- Modify: `frontend/src/components/studio/stages/RenderStage.tsx`
  - 改造成生成提交工作台
- Modify: `frontend/src/components/studio/stages/ReviewStage.tsx`
  - 改造成精修交付工作台

### 测试

- Modify: `frontend/src/pages/__tests__/ProjectStudioPage.test.tsx`
  - 验证正式页新骨架和五阶段入口渲染
- Modify: `frontend/src/components/studio/__tests__/StudioShell.test.tsx`
  - 验证新壳层布局槽位
- Modify: `frontend/src/components/studio/__tests__/StudioStageNav.test.tsx`
  - 验证阶段轨道状态、阻塞提示和摘要
- Modify: `frontend/src/components/studio/stages/__tests__/IngestStage.test.tsx`
- Modify: `frontend/src/components/studio/stages/__tests__/ScopeStage.test.tsx`
- Modify: `frontend/src/components/studio/stages/__tests__/PromptStage.test.tsx`
- Modify: `frontend/src/components/studio/stages/__tests__/RenderStage.test.tsx`
- Modify: `frontend/src/components/studio/stages/__tests__/ReviewStage.test.tsx`

---

## Chunk 1: 正式页骨架与视图派生

### Task 1: 先用测试锁定正式页新骨架

**Files:**
- Modify: `frontend/src/pages/__tests__/ProjectStudioPage.test.tsx`
- Modify: `frontend/src/components/studio/__tests__/StudioShell.test.tsx`
- Modify: `frontend/src/components/studio/__tests__/StudioStageNav.test.tsx`

- [ ] **Step 1: 为正式页补一个失败测试，断言新骨架展示页头、阶段轨道和专业摘要面板**
- [ ] **Step 2: 为阶段轨道补失败测试，断言当前阶段目标、阻塞原因和下一步提示会同时展示**
- [ ] **Step 3: 运行页面与壳层相关测试，确认新增断言先失败**

Run:
`npm --prefix frontend run test -- --run frontend/src/pages/__tests__/ProjectStudioPage.test.tsx frontend/src/components/studio/__tests__/StudioShell.test.tsx frontend/src/components/studio/__tests__/StudioStageNav.test.tsx`

- [ ] **Step 4: 在 `studio/types.ts`、`studio/constants.ts`、`studio/selectors.ts` 中补齐新骨架需要的类型、静态文案和派生逻辑**
- [ ] **Step 5: 重构 `StudioShell.tsx`、`StudioHeader.tsx`、`StudioStageNav.tsx`、`StudioInspector.tsx`，让它们通过新骨架测试**
- [ ] **Step 6: 运行同一组测试，确认新骨架相关测试转绿**

### Task 2: 让正式 ProjectStudioPage 接入新骨架

**Files:**
- Modify: `frontend/src/pages/ProjectStudioPage.tsx`
- Modify: `frontend/src/studio/useProjectStudio.ts`

- [ ] **Step 1: 为正式页补失败测试，断言当前阶段的主目标摘要和右侧专业摘要指标会基于 hook 数据展示**
- [ ] **Step 2: 运行正式页测试，确认新断言失败且失败原因正确**

Run:
`npm --prefix frontend run test -- --run frontend/src/pages/__tests__/ProjectStudioPage.test.tsx`

- [ ] **Step 3: 重构 `ProjectStudioPage.tsx`，把旧的准备清单 / 检查器 / 任务中心组织改成新壳层下的页面组合**
- [ ] **Step 4: 如有必要，仅最小幅度调整 `useProjectStudio.ts` 暴露给页面的派生数据**
- [ ] **Step 5: 运行正式页测试，确认新页面骨架在真实 hook mock 下渲染正确**

---

## Chunk 2: Ingest 与 Scope 迁移

### Task 3: 将 Ingest 改造成输入准备工作台

**Files:**
- Modify: `frontend/src/components/studio/stages/IngestStage.tsx`
- Modify: `frontend/src/components/studio/stages/__tests__/IngestStage.test.tsx`

- [ ] **Step 1: 为 IngestStage 写失败测试，断言页面包含“输入来源”“上传与解析状态”“已识别文档列表”“就绪摘要”四类面板**
- [ ] **Step 2: 运行 IngestStage 测试，确认新增断言失败**

Run:
`npm --prefix frontend run test -- --run frontend/src/components/studio/stages/__tests__/IngestStage.test.tsx`

- [ ] **Step 3: 重构 `IngestStage.tsx`，保留真实上传/OCR动作，但按 V2 风格重排成输入准备工作台**
- [ ] **Step 4: 运行 IngestStage 测试，确认通过**

### Task 4: 将 Scope 改造成范围确认工作台

**Files:**
- Modify: `frontend/src/components/studio/stages/ScopeStage.tsx`
- Modify: `frontend/src/components/studio/stages/__tests__/ScopeStage.test.tsx`

- [ ] **Step 1: 为 ScopeStage 写失败测试，断言页面以“输入来源确认”“推荐范围”“手动微调”“范围摘要”四个判断面板组织**
- [ ] **Step 2: 运行 ScopeStage 测试，确认新增断言失败**

Run:
`npm --prefix frontend run test -- --run frontend/src/components/studio/stages/__tests__/ScopeStage.test.tsx`

- [ ] **Step 3: 重构 `ScopeStage.tsx`，保留 preset、章节树、预览和确认动作，但把它们重组到新面板中**
- [ ] **Step 4: 运行 ScopeStage 测试，确认通过**

---

## Chunk 3: Prompt 与 Render 迁移

### Task 5: 将 Prompt 改造成草案评审工作台

**Files:**
- Modify: `frontend/src/components/studio/stages/PromptStage.tsx`
- Modify: `frontend/src/components/studio/stages/__tests__/PromptStage.test.tsx`

- [ ] **Step 1: 为 PromptStage 写失败测试，断言页面包含“候选草案池”“用途标签/生成意图”“风险提示”“已保留集”**
- [ ] **Step 2: 运行 PromptStage 测试，确认新增断言失败**

Run:
`npm --prefix frontend run test -- --run frontend/src/components/studio/stages/__tests__/PromptStage.test.tsx`

- [ ] **Step 3: 重构 `PromptStage.tsx`，把真实草案数据、模式设置和草案状态操作重组为策展式工作台**
- [ ] **Step 4: 运行 PromptStage 测试，确认通过**

### Task 6: 将 Render 改造成生成提交工作台

**Files:**
- Modify: `frontend/src/components/studio/stages/RenderStage.tsx`
- Modify: `frontend/src/components/studio/stages/__tests__/RenderStage.test.tsx`

- [ ] **Step 1: 为 RenderStage 写失败测试，断言页面拆分出“默认参数”“成本预估”“资产队列”“提交动作”四类信息块**
- [ ] **Step 2: 运行 RenderStage 测试，确认新增断言失败**

Run:
`npm --prefix frontend run test -- --run frontend/src/components/studio/stages/__tests__/RenderStage.test.tsx`

- [ ] **Step 3: 重构 `RenderStage.tsx`，保留参数编辑、单资产覆盖、预览和下载能力，但按 V2 逻辑重排**
- [ ] **Step 4: 运行 RenderStage 测试，确认通过**

---

## Chunk 4: Review 迁移与正式页回归

### Task 7: 将 Review 改造成精修交付工作台

**Files:**
- Modify: `frontend/src/components/studio/stages/ReviewStage.tsx`
- Modify: `frontend/src/components/studio/stages/__tests__/ReviewStage.test.tsx`

- [ ] **Step 1: 为 ReviewStage 写失败测试，断言页面包含“结果清单”“当前版本详情”“精修动作”“交付摘要”**
- [ ] **Step 2: 运行 ReviewStage 测试，确认新增断言失败**

Run:
`npm --prefix frontend run test -- --run frontend/src/components/studio/stages/__tests__/ReviewStage.test.tsx`

- [ ] **Step 3: 重构 `ReviewStage.tsx`，保留版本流、预览、下载、精修和最终稿标记逻辑，但重排为统一工作台**
- [ ] **Step 4: 运行 ReviewStage 测试，确认通过**

### Task 8: 完成正式页整体验证

**Files:**
- Modify: `frontend/src/pages/__tests__/ProjectStudioPage.test.tsx`
- Modify: `frontend/src/components/studio/__tests__/*`
- Modify: `frontend/src/components/studio/stages/__tests__/*`

- [ ] **Step 1: 补齐正式页五阶段回归测试，覆盖 ingest / scope / prompt / render / review 在新布局下的关键渲染**
- [ ] **Step 2: 运行目标测试集合，确认正式页与五阶段测试全部通过**

Run:
`npm --prefix frontend run test -- --run frontend/src/pages/__tests__/ProjectStudioPage.test.tsx frontend/src/components/studio/__tests__/StudioShell.test.tsx frontend/src/components/studio/__tests__/StudioStageNav.test.tsx frontend/src/components/studio/stages/__tests__/IngestStage.test.tsx frontend/src/components/studio/stages/__tests__/ScopeStage.test.tsx frontend/src/components/studio/stages/__tests__/PromptStage.test.tsx frontend/src/components/studio/stages/__tests__/RenderStage.test.tsx frontend/src/components/studio/stages/__tests__/ReviewStage.test.tsx`

- [ ] **Step 3: 运行前端构建，确认页面结构迁移没有引入新的编译错误**

Run:
`npm --prefix frontend run build`

- [ ] **Step 4: 整理迁移结果、残余风险和 demo 页面后续去留建议**

---

Plan complete and saved to `docs/superpowers/plans/2026-04-06-studio-v2-rollout-implementation.md`.
