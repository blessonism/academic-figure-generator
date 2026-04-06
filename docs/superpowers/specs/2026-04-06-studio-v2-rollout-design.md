# 正式 Studio 采用 V2 设计语言改造设计文档

**日期：** 2026-04-06

## 目标

将 [StudioDemoV2Page](/Users/suki/code/academic-figure-generator/frontend/src/pages/StudioDemoV2Page.tsx)
验证过的页面结构、视觉节奏和阶段内信息组织方式迁回正式 Studio，
使 [ProjectStudioPage](/Users/suki/code/academic-figure-generator/frontend/src/pages/ProjectStudioPage.tsx)
成为新版正式工作台，而不是继续维护一套独立 demo。

本次改造要求覆盖正式 Studio 的全部五个阶段：

- ingest：输入准备
- scope：范围确认
- prompt：草案评审
- render：生成提交
- review：精修交付

## 背景与现状

当前正式 Studio 已具备真实业务能力，包括：

- 文档上传与 OCR
- 范围确认与章节选择
- Prompt 草案生成与草案状态管理
- 图片生成参数配置与结果轮询
- 图片版本流、精修和最终稿标记

但正式 Studio 页面仍延续旧版“三栏工作台”结构：

- 顶部头部
- 阶段导航
- 左侧准备清单
- 中间主工作区
- 右侧检查器
- 底部任务中心

这套结构在业务功能完整性上没有问题，但存在几个体验问题：

1. 用户注意力被分散到多个并列面板，当前主任务不够突出。
2. 阶段内部的信息组织更偏“功能堆叠”，不够像专业工作台。
3. `scope / prompt / render` 与 `ingest / review` 的节奏不统一，难以形成完整流程感。

与此同时，`/studio-demo-v2` 已验证一套更适合当前产品阶段的结构：

- 页面级信息层次更清楚
- 阶段内部改为“专业判断面板”组织
- 摘要指标收敛到固定侧栏
- 视觉上更像研究生产工作台

因此本次改造不再把 V2 视为实验页面，而是作为正式 Studio 的新设计基线。

## 设计原则

### 1. 当前任务始终位于页面中心

正式 Studio 的第一视觉重点必须是“当前阶段要完成什么”，而不是
多个次级信息区并列竞争注意力。辅助信息应服务当前阶段，而不是抢占主区。

### 2. 五个阶段使用同一套语言

虽然 `ingest`、`review` 与 V2 demo 中原本未覆盖的阶段不同，
但也要沿用相同的结构语言：

- 阶段目标明确
- 面板按判断任务拆分
- 关键指标右侧收口
- 阶段动作显式呈现

### 3. 保留正式业务能力，只迁移交互组织方式

本次改造重点是正式 Studio 的页面壳层和阶段内部编排方式，不另起第二套状态机，
也不重写现有后端协议。真实数据与动作仍由
[useProjectStudio](/Users/suki/code/academic-figure-generator/frontend/src/studio/useProjectStudio.ts)
统一驱动。

### 4. 摘要与辅助信息统一收口

当前分散在“准备清单”“检查器”“任务中心”里的信息，需要按阶段语义重新整合。
用户不应在多个辅助容器之间来回切换来理解当前状态。

## 页面级结构

正式 Studio 将从当前 [StudioShell](/Users/suki/code/academic-figure-generator/frontend/src/components/studio/StudioShell.tsx)
主导的布局，改为更接近 V2 的四段式结构：

1. 顶部项目头部
2. 阶段轨道
3. 主工作区
4. 右侧专业摘要面板

### 顶部项目头部

负责承载：

- 项目名称与项目标识
- 当前阶段信息
- 页面级状态概览
- 必要的全局动作（如回到项目列表、阶段相关总览入口）

视觉上保留正式项目身份，但采用 V2 更强的工作台氛围和层次感。

### 阶段轨道

阶段轨道替代当前普通卡片式导航，统一展示：

- 阶段名称
- 阶段目标摘要
- 当前 / 已完成 / 待解锁状态
- 阻塞原因与下一步动作（如存在）

轨道仍保留正式流程的阶段访问规则，而不是 demo 中的自由预览。

### 主工作区

主工作区按阶段切换，但内部不再是“单页堆功能”，而是组织成多个高内聚判断面板。

### 右侧专业摘要面板

右侧固定摘要面板取代当前“准备清单 + 检查器”的双重语义，
用于展示跨阶段最关键的摘要指标和提醒，如：

- 当前阶段核心指标
- 是否具备进入下一阶段的条件
- 风险提示
- 推荐下一步

### 任务中心处理

底部独立任务中心不再作为页面固定区块保留。
它的有效信息会按阶段语义合并到主区或右侧摘要区；
如某些任务状态仍需持续展示，则以内联状态卡形式嵌入相关阶段。

## 五阶段设计

### Ingest：输入准备工作台

`ingest` 需要从“上传区 + OCR 状态”升级为完整输入准备工作台，
建议拆成四个面板：

1. 输入来源
2. 上传与解析状态
3. 已识别文档列表
4. 进入范围阶段的就绪摘要

信息重点：

- 当前项目已上传哪些文档
- 哪些文档已完成 OCR / 解析
- 当前是否已有可用于范围确认的章节结构
- 如果仍无法进入 `scope`，阻塞原因是什么

设计意图：
让用户在进入后续判断前，先确认“输入是否可靠且足够”。

### Scope：范围确认工作台

正式 [ScopeStage](/Users/suki/code/academic-figure-generator/frontend/src/components/studio/stages/ScopeStage.tsx)
已有较强的真实能力，改造时保留这些能力，并重组为更专业的面板式布局：

1. 输入来源确认
2. 推荐范围 / preset 选择
3. 手动章节微调
4. 范围摘要与进入下一阶段条件

其中“章节树 + 预览”仍保留，但会被纳入“手动微调”面板，而不是单独占据整块页面。

设计重点：

- 推荐方案与人工微调并列
- 让“为什么选这些章节”更易理解
- 明确本轮范围确认后的实际影响

### Prompt：草案评审工作台

正式 [PromptStage](/Users/suki/code/academic-figure-generator/frontend/src/components/studio/stages/PromptStage.tsx)
会从“参数区 + 草案列表”升级为更像策展面板的结构：

1. 候选草案池
2. 用途标签 / 生成意图
3. 风险提示
4. 已保留集

现有真实能力将这样映射：

- `promptMode`、`promptRequest`、`templateMode` 进入“用途标签 / 生成意图”
- `drafts` 主体进入“候选草案池”
- 草案来源章节、图类型、状态等派生为“风险提示”与保留依据
- `accepted` 草案形成“已保留集”

设计重点：

- “接受 / 跳过”不再只是按钮动作，而是策展决策的一部分
- 让用户一眼看出哪些草案值得继续出图，哪些风险更高

### Render：生成提交工作台

正式 [RenderStage](/Users/suki/code/academic-figure-generator/frontend/src/components/studio/stages/RenderStage.tsx)
将沿用 V2 的规格化思路，拆成：

1. 项目默认参数 / 本次默认参数
2. 成本预估
3. 资产队列
4. 提交动作与状态反馈

现有真实能力保留：

- 会话默认参数编辑
- 单资产覆盖参数
- 预览与下载
- 生成状态轮询与失败提示

设计重点：

- 把规格、成本和执行动作拆开
- 降低“参数很多但难以形成决策”的压力
- 让用户先确认“这一轮要生成什么”，再真正提交

### Review：精修交付工作台

正式 [ReviewStage](/Users/suki/code/academic-figure-generator/frontend/src/components/studio/stages/ReviewStage.tsx)
本身已经有强业务能力，因此本次重点是重排为统一的专业交付结构：

1. 结果清单
2. 当前版本详情
3. 精修动作
4. 交付摘要

可展示的关键信息包括：

- 每个 prompt 对应的版本流
- 当前选中版本状态
- 是否已标记最终稿
- 精修指令输入
- 下载与预览动作
- 交付准备情况

设计重点：

- 让 review 阶段和前面四个阶段的“面板式判断”语言一致
- 减少旧布局中“左列表 + 中预览 + 右操作”带来的割裂感

## 数据与状态衔接

### 单一真实状态源

正式 Studio 继续使用
[useProjectStudio](/Users/suki/code/academic-figure-generator/frontend/src/studio/useProjectStudio.ts)
作为唯一真实状态来源。

本次不会新增独立的正式 V2 state hook，不会把 demo 的 mock 状态迁入生产流程。

### 视图模型重组

为避免 `ProjectStudioPage` 内堆积大量摘要计算逻辑，
需要在 `frontend/src/studio/` 下新增或扩展轻量 selector / mapper，
把以下内容转为视图模型：

- 五阶段轨道展示信息
- 右侧专业摘要面板指标
- 各阶段顶部目标摘要
- 各阶段的风险与下一步提示

### 阻塞规则保留

阶段流转仍遵循当前正式规则：

- 无可用解析结果，不能进入 `scope`
- 未确认范围，不能进入 `prompt`
- 无已接受草案，不能进入 `render`
- 无已生成结果，不能进入 `review`

新的布局只改变展示方式，不改变这些业务约束。

## 组件边界建议

建议将这次改造拆成以下几类组件边界：

### 页面壳层

- 正式 Studio 页头
- 阶段轨道
- 专业摘要面板
- 通用阶段说明 / 状态卡

### 阶段组件

保留 `stages/` 目录下五个阶段组件，但逐步重构其内部结构，
确保每个阶段组件专注于当前阶段的判断任务。

### 视图派生层

在 `studio/` 目录下补充派生选择器，避免页面 JSX 直接混杂过多业务计算。

## 测试策略

本次改造必须以正式 Studio 的回归安全为核心，测试重点包括：

1. 正式页面入口与五阶段渲染是否正常
2. 阶段轨道是否正确反映当前 / 完成 / 阻塞状态
3. 五阶段在真实 hook 数据下是否展示正确的主区与摘要内容
4. `scope / prompt / render / review` 的关键交互是否仍能驱动原有动作

具体会更新或新增：

- [ProjectStudioPage.test.tsx](/Users/suki/code/academic-figure-generator/frontend/src/pages/__tests__/ProjectStudioPage.test.tsx)
- 各阶段组件测试
- 页面壳层 / 阶段轨道相关测试

`StudioDemoPage` 与 `StudioDemoV2Page` 在本轮不作为正式逻辑测试目标，
但会保留作为设计参考。

## 非目标

本次改造不包含以下内容：

- 重写后端接口
- 新增正式 V2 mock 状态层
- 删除 demo 页面
- 引入与当前需求无关的大规模状态管理重构
- 重新定义五阶段业务规则

## 交付结果

完成后应得到：

1. 正式 `/projects/:id` 页面采用 V2 设计语言
2. 五个阶段都以统一的专业工作台方式组织
3. 真实数据链路与现有业务动作保持可用
4. 页面测试与关键阶段测试同步更新
