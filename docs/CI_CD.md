# CI/CD Setup Guide

## GitHub Actions 工作流

### 1. CI Pipeline (ci.yml)
每次 push 和 PR 时自动运行：
- ✅ 代码语法检查 (ESLint)
- ✅ JSON 文件验证
- ✅ 文件结构检查
- ✅ 单元测试 (待添加)
- ✅ 自动创建 Release

### 2. Deploy Pipeline (deploy.yml)
手动触发部署：
- 打包小程序代码
- 上传到微信小程序平台 (需要配置密钥)
- 生成部署包 Artifact

---

## 配置 Secrets

在 GitHub 仓库设置中添加以下 Secrets：

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `WECHAT_APPID` | 小程序 AppID | 微信公众平台 → 开发管理 → 开发设置 |
| `WECHAT_PRIVATE_KEY` | 小程序上传密钥 | 微信公众平台 → 开发管理 → 开发设置 → 小程序代码上传 |

### 获取上传密钥步骤：
1. 登录微信公众平台 (https://mp.weixin.qq.com)
2. 进入「开发」→「开发管理」→「开发设置」
3. 找到「小程序代码上传」
4. 生成并下载密钥文件
5. 将密钥内容复制到 GitHub Secrets

---

## 使用流程

### 日常开发
1. 创建功能分支：`git checkout -b feature/xxx`
2. 提交代码：`git commit -m "feat: xxx"`
3. 推送分支：`git push origin feature/xxx`
4. 创建 Pull Request
5. CI 自动检查代码
6. 合并到 main 分支

### 发布版本
1. 进入 Actions → Deploy to WeChat Mini Program
2. 点击「Run workflow」
3. 输入版本号和描述
4. 自动打包并上传

---

## 版本号规范

使用语义化版本：
- `MAJOR.MINOR.PATCH`
- 例如：`1.0.0`, `1.1.0`, `1.1.1`

| 版本变化 | 说明 |
|----------|------|
| MAJOR | 重大更新，可能不兼容 |
| MINOR | 新功能，向后兼容 |
| PATCH | 修复 bug |

---

## 本地测试 CI

```bash
# 安装依赖
cd cloud/functions/user && npm install
cd ../member && npm install

# 运行 lint
npm run lint

# 运行测试
npm test
```
