# Studio 浅色高阶工作台设计说明

## 背景

当前 `studio` 已具备稳定的工作流壳层：

- 顶部 `StudioHeader`
- 阶段导航 `StudioStageNav`
- 主内容区
- 右侧信息面板（准备清单、专业摘要面板、任务中心）

现状问题不在业务流程，而在视觉语言仍偏“默认卡片堆叠”。页面虽可用，但缺少主工作台应有的层次感、品牌感和专业控制台气质。

## 目标

将 `studio` 提升为浅色基调的高阶研究工作台，在不改变现有业务行为和阶段流转逻辑的前提下，完成以下目标：

1. 强化页面的专业感和品牌感，让 `/projects/:id` 更像主工作台而不是普通详情页。
2. 统一 `header`、阶段导航、右侧信息卡的视觉语言，减少“拼装感”。
3. 保持浅色色调，避免深色界面的压迫感，同时保留高级质感。
4. 不重写 `useProjectStudio` 等业务逻辑，仅做 UI 壳层与信息表达优化。

## 非目标

以下内容不在本次范围内：

- 不调整阶段业务逻辑与数据结构
- 不修改 `useProjectStudio` 的状态编排
- 不重做各阶段内部的大型业务组件
- 不引入新的后端接口

## 设计方向

### 1. 顶部区域：浅色英雄区

`StudioHeader` 从当前深色渐变卡升级为浅色英雄区：

- 使用低饱和浅青 / 米白 / 冷灰渐变作为底色
- 加入柔和高光、细描边与模糊叠层，形成轻玻璃质感
- 标题层级更明确，副文案更像产品定位文案
- 将“当前阶段”信息改造成更精致的状态卡，而不是普通文字块
- 额外展示轻量级的工作台指标摘要，让 header 与主体内容形成呼应

### 2. 阶段导航：流程轨道化

`StudioStageNav` 从并列功能卡升级为流程状态导航：

- 每个阶段卡包含：阶段序号、标题、状态标签、目标描述、下一步动作
- 当前阶段具有更强的边框、阴影和背景强调
- 已完成阶段采用轻成功态视觉
- 待解锁阶段保留提示，但弱化交互感
- 整体卡片造型、圆角、边框和 hover 反馈更统一

### 3. 页面骨架：工作台而非普通页面

`StudioShell` 调整为更完整的工作台版式：

- 背景增加弱层次，不再只是单一白底
- 顶部与导航之间留出更舒展的节奏
- 主区与右侧信息栏的分组关系更明确
- 右侧信息栏更像“控制台侧轨”，而不是三张独立默认卡片

### 4. 右侧信息组件：统一控制台卡片语言

`StudioHealthChecklist`、`StudioInspector`、`StudioTaskCenter` 统一改造：

- 使用一致的标题区、辅助说明、边框和内层 item 结构
- item 由“普通边框框”升级为更细腻的分组条目
- 状态标签统一成浅色 badge 风格
- 强化文本层次，让标签、说明、详情的视觉优先级更清晰

## 参考灵感

本次会使用 `21st magic` MCP 作为灵感和组件提炼来源，方向定位为：

- `premium dashboard workspace`
- 浅色控制台
- 高级卡片与状态面板
- 专业创作 / 研究工作台

## 影响文件

- `frontend/src/pages/ProjectStudioPage.tsx`
- `frontend/src/components/studio/StudioHeader.tsx`
- `frontend/src/components/studio/StudioShell.tsx`
- `frontend/src/components/studio/StudioStageNav.tsx`
- `frontend/src/components/studio/StudioHealthChecklist.tsx`
- `frontend/src/components/studio/StudioInspector.tsx`
- `frontend/src/components/studio/StudioTaskCenter.tsx`
- 相关测试文件

## 测试与验证

优先覆盖以下内容：

1. `StudioShell` 仍维持单侧信息栏结构
2. `StudioStageNav` 仍正确展示目标、阻塞原因与下一步动作
3. `ProjectStudioPage` 仍可在不同阶段渲染完整框架
4. 新增的视觉文案与摘要信息有测试兜底

## 风险与控制

- 风险：样式升级过度，影响内容密度或可读性
  - 控制：保持浅色对比度，避免大面积装饰遮挡信息
- 风险：导航重构影响现有测试与交互
  - 控制：保持 `onStageSelect` 触发逻辑不变
- 风险：右侧信息卡改动过大导致阶段组件喧宾夺主
  - 控制：右栏强调“摘要与决策支持”，不与主内容争抢视觉焦点

## 结论

本次应采用“浅色高阶研究驾驶舱”方案。实现重点不是新功能，而是通过统一的视觉系统让现有 `studio` 工作流更像成熟产品。
