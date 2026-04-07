# 科研配图市场首期设计文档

## 目标

在现有科研配图生成平台上新增公开市场域，支持：

- 用户将已生成完成的配图手动发布到市场
- 管理员上传官方精选内容
- 分类、标签、点赞、收藏、下载
- 市场条目作为垫图进入生成流程
- 市场条目导入到项目素材库

## 范围

首期采用“统一市场条目层”方案，不直接暴露 `images` 表。

核心对象：

- `MarketItem`
- `MarketCategory`
- `MarketTag`
- `MarketItemTag`
- `MarketItemLike`
- `MarketItemFavorite`
- `ProjectReferenceAsset`

## 业务规则

### 发布与可见性

- 用户图片默认私有，不自动进入市场
- 用户手动发布后立即 `published`
- 管理员可将条目设为精选或隐藏
- 官方上传条目可先为 `draft`，再发布

### 内容类型

- `ai_generated`：论文链接可选
- `non_ai_figure`：论文链接必填

### 访问控制

- 市场列表与详情对游客公开
- 点赞、收藏、下载、垫图、导入项目要求登录
- 管理员可编辑任意条目
- 普通用户仅能编辑自己创建的条目

### 下载与复用

- 市场主图即首期默认下载图
- 下载成功后累计 `download_count`
- 市场详情页可直接跳转 `/generate?referenceMarketItemId=...`
- 导入项目时复制文件到用户命名空间，避免依赖公开市场资源存活

## 前端结构

新增页面：

- `/market`
- `/market/items/:id`
- `/market/mine`
- `/admin/market`

扩展页面：

- `/generate` 支持市场垫图模式
- 项目工作台增加参考素材区

## 后端接口

公开接口：

- `GET /market/items`
- `GET /market/items/{item_id}`
- `GET /market/items/{item_id}/cover`
- `GET /market/categories`
- `GET /market/tags`

登录接口：

- `POST /market/items/from-images/{image_id}`
- `GET /market/my-items`
- `PUT /market/my-items/{item_id}`
- `PUT /market/items/{item_id}/like`
- `DELETE /market/items/{item_id}/like`
- `PUT /market/items/{item_id}/favorite`
- `DELETE /market/items/{item_id}/favorite`
- `GET /market/items/{item_id}/download`
- `POST /market/items/{item_id}/generate-from-reference`
- `POST /market/items/{item_id}/import-to-project`

管理员接口：

- `GET /admin/market/items`
- `POST /admin/market/items`
- `PUT /admin/market/items/{item_id}`
- `PUT /admin/market/items/{item_id}/feature`
- `PUT /admin/market/items/{item_id}/hide`
- `POST /admin/market/categories`
- `PUT /admin/market/categories/{id}`
- `POST /admin/market/tags`
- `PUT /admin/market/tags/{id}`

项目参考素材接口：

- `GET /projects/{project_id}/reference-assets`
- `GET /projects/{project_id}/reference-assets/{asset_id}/download`

## 排序

- `latest`：按 `published_at desc`
- `hot`：按 `(like_count * 3) + (favorite_count * 2) + download_count desc`

## 首期不做

- 评论、关注、举报、版权申诉
- 自由创建标签
- 全文搜索
- 素材授权协议与分发许可体系
- Studio 深度消费项目参考素材的复杂编排
