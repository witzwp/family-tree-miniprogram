# 家谱微信小程序 - 产品规格说明书

## 📋 项目概述

**项目名称**: 家族树 (FamilyTree)  
**类型**: 微信小程序  
**目标用户**: 家族成员（各年龄段）  
**核心功能**: 成员信息登记 + 家谱可视化（脑图/树形图）

### 核心价值
- 收集和保存家族历史与成员信息
- 可视化展示家族关系和辈分结构
- 便于家族成员间相互了解和联系

---

## 🎯 功能需求

### 1. 用户登录与身份验证
- 微信小程序一键登录（获取微信用户信息）
- 首次使用需完成实名登记
- 已登记用户自动识别

### 2. 个人信息登记
**首次进入流程**:
1. 欢迎页 + 简介
2. 填写基本信息:
   - 姓名（真实姓名）
   - 性别
   - 出生日期
   - 籍贯/现居地
   - 联系电话（可选）
   - 微信号（可选）
3. 关联家族关系:
   - 父亲（姓名/选择已有成员）
   - 母亲（姓名/选择已有成员）
   - 配偶（如有，选择已有成员或登记）
   - 子女（如有，选择已有成员或后续添加）
4. 上传头像（可选）
5. 个人简介/备注（可选）

### 3. 家谱可视化
**已登记用户进入直接显示家谱**:
- **树形视图**: 传统的家谱树结构，从上到下按辈分排列
- **脑图视图**: 以当前用户为中心发散展示（类似思维导图）
- **列表视图**: 按辈分或字母排序的列表

**交互功能**:
- 点击成员查看详情
- 缩放/拖拽浏览大家族
- 搜索成员
- 筛选（按辈分、按分支等）

### 4. 成员详情页
- 头像 + 基本信息
- 家族关系图谱（父母、配偶、子女、兄弟姐妹）
- 联系方式（如本人授权显示）
- 编辑入口（仅自己可编辑）

### 5. 家族管理功能
- 添加/编辑家庭成员
- 关系修正申请（如发现信息错误可申请修改）
- 邀请成员（分享小程序给家族群）

### 6. 数据统计
- 家族总人数
- 辈分统计
- 地域分布
- 生日提醒

---

## 🔄 用户流程

```
┌─────────────────┐
│   打开小程序     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  已登记用户？    │────▶│   显示家谱首页   │
└────────┬────────┘ 是   └─────────────────┘
         │ 否
         ▼
┌─────────────────┐
│   欢迎引导页     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  填写个人信息    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  关联家族关系    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   完成登记       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   显示家谱首页   │
└─────────────────┘
```

---

## 🗄️ 数据模型

### 用户表 (users)
```json
{
  "_id": "ObjectId",
  "wxOpenId": "string",           // 微信OpenID
  "wxUnionId": "string",          // 微信UnionID
  "avatarUrl": "string",          // 微信头像
  "nickname": "string",           // 微信昵称
  "createdAt": "DateTime",
  "updatedAt": "DateTime"
}
```

### 成员表 (members)
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",           // 关联用户ID（可为空，代录入）
  "name": "string",               // 真实姓名
  "gender": "enum: male/female",
  "birthDate": "Date",
  "deathDate": "Date",            // 已故成员
  "birthplace": "string",         // 籍贯
  "currentLocation": "string",    // 现居地
  "phone": "string",
  "wechatId": "string",
  "avatar": "string",             // 头像URL
  "bio": "string",                // 简介
  "fatherId": "ObjectId",         // 父亲ID
  "motherId": "ObjectId",         // 母亲ID
  "spouseId": "ObjectId",         // 配偶ID
  "generation": "number",         // 辈分（自动计算）
  "createdBy": "ObjectId",        // 创建者
  "updatedBy": "ObjectId",        // 最后更新者
  "isVerified": "boolean",        // 信息已核实
  "createdAt": "DateTime",
  "updatedAt": "DateTime"
}
```

### 家族表 (families)
```json
{
  "_id": "ObjectId",
  "name": "string",               // 家族名称（如"张氏家谱"）
  "description": "string",        // 家族简介
  "rootAncestorId": "ObjectId",   // 始祖ID
  "adminIds": ["ObjectId"],       // 管理员
  "memberCount": "number",
  "createdAt": "DateTime"
}
```

### 家族成员关联表 (family_members)
```json
{
  "_id": "ObjectId",
  "familyId": "ObjectId",
  "memberId": "ObjectId",
  "role": "enum: admin/member",
  "joinedAt": "DateTime"
}
```

---

## 🛠️ 技术栈

### 前端
- **框架**: 微信小程序原生 / Taro 3.x (React/Vue)
- **UI 组件库**: Vant Weapp / Taro UI
- **图表库**: 
  - 家谱树: D3.js (via taro-d3) 或自定义 Canvas
  - 脑图: @antv/g6 适配小程序版本

### 后端
- **云开发**: 微信云开发（推荐，免服务器运维）
  - 云函数 (Node.js)
  - 云数据库 (MongoDB)
  - 云存储（头像、图片）
- **或自建服务器**:
  - Node.js + Express / NestJS
  - MongoDB / PostgreSQL
  - Redis (缓存)

### 其他服务
- 微信登录 SDK
- 短信服务（可选，验证手机号）

---

## 📱 页面设计

### 1. 欢迎/引导页 (pages/welcome/index)
- 家族Logo/名称
- 简介文案
- "开始登记" 按钮

### 2. 个人信息登记页 (pages/register/profile)
- 表单：姓名、性别、出生日期、籍贯、现居地
- 日期选择器
- 地区选择器

### 3. 关系登记页 (pages/register/relations)
- 搜索/选择父亲
- 搜索/选择母亲
- 添加配偶
- 添加子女
- "暂不清楚，后续补充" 选项

### 4. 家谱首页 (pages/family/tree)
- 顶部：家族名称 + 统计信息
- 主体：家谱树/脑图可视化
- 底部：切换视图模式（树形/脑图/列表）
- 悬浮按钮：添加成员、搜索

### 5. 成员详情页 (pages/member/detail)
- 头像 + 姓名 + 辈分标签
- 基本信息卡片
- 关系图谱（小图）
- 联系方式（权限控制）
- 编辑按钮（仅自己）

### 6. 添加成员页 (pages/member/add)
- 类似登记页，但可代录入
- 选择关联关系

### 7. 搜索页 (pages/search/index)
- 搜索框
- 搜索结果列表
- 筛选条件（辈分、分支等）

### 8. 个人中心 (pages/user/index)
- 我的信息
- 我的家族
- 邀请成员
- 设置

---

## 🔌 API 设计

### 用户相关
```
POST /api/login          # 微信登录
GET  /api/user/profile   # 获取当前用户信息
PUT  /api/user/profile   # 更新用户信息
```

### 成员相关
```
GET    /api/members              # 获取成员列表
POST   /api/members              # 创建成员
GET    /api/members/:id          # 获取成员详情
PUT    /api/members/:id          # 更新成员信息
DELETE /api/members/:id          # 删除成员（管理员）
GET    /api/members/:id/tree     # 获取成员家谱树
GET    /api/members/:id/siblings # 获取兄弟姐妹
GET    /api/members/:id/children # 获取子女
```

### 家族相关
```
GET    /api/families/:id         # 获取家族信息
GET    /api/families/:id/members # 获取家族所有成员
GET    /api/families/:id/stats   # 家族统计
POST   /api/families/:id/invite  # 邀请成员
```

---

## 📊 家谱树算法

### 辈分计算
```javascript
function calculateGeneration(member, rootGeneration = 1) {
  if (!member.fatherId && !member.motherId) {
    return rootGeneration;
  }
  // 递归计算，取父母辈分 + 1
  const parentGen = getParentGeneration(member);
  return parentGen + 1;
}
```

### 树形布局算法
- 使用 Reingold-Tilford 树布局算法
- 考虑多配偶情况（横向扩展）
- 支持缩放和平移

---

## 🔒 隐私与安全

- 敏感信息（手机号、微信号）仅对家族成员可见
- 可设置信息可见范围（仅本人/仅亲属/全部成员）
- 修改关键信息需管理员审核
- 数据备份机制

---

## 📅 开发计划

### Phase 1 - MVP (2-3周)
- [ ] 小程序框架搭建
- [ ] 微信登录
- [ ] 个人信息登记
- [ ] 基础家谱树展示

### Phase 2 - 核心功能 (2-3周)
- [ ] 家族关系录入
- [ ] 家谱可视化优化
- [ ] 成员搜索
- [ ] 成员详情页

### Phase 3 - 增强功能 (2周)
- [ ] 脑图视图
- [ ] 数据统计
- [ ] 邀请分享
- [ ] 数据导出

### Phase 4 - 优化迭代 (持续)
- [ ] 性能优化
- [ ] UI 美化
- [ ] 用户反馈

---

## 📁 项目结构

```
family-tree-miniprogram/
├── src/
│   ├── pages/
│   │   ├── welcome/
│   │   ├── register/
│   │   ├── family/
│   │   ├── member/
│   │   ├── search/
│   │   └── user/
│   ├── components/
│   │   ├── family-tree/
│   │   ├── member-card/
│   │   └── relation-picker/
│   ├── utils/
│   ├── services/
│   └── app.
├── cloud/
│   └── functions/
├── docs/
└── README.md
```

---

## 📝 待决策事项

1. **技术选型**: 原生小程序 vs Taro?
2. **后端方案**: 微信云开发 vs 自建服务器?
3. **家谱图库**: 自研 Canvas  vs 现有图表库适配?
4. **多家族支持**: 是否支持一个用户属于多个家族?
5. **代录入功能**: 是否允许为已故长辈录入信息?

---

**文档版本**: v1.0  
**创建日期**: 2026-03-03  
**作者**: Winston Zhang
