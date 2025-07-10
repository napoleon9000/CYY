# CYY 后端服务设置指南

本指南将帮助您设置 Supabase 后端服务，为 CYY 药物提醒应用添加社交功能。

## 目录

1. [前置要求](#前置要求)
2. [Supabase 账号设置](#supabase-账号设置)
3. [数据库初始化](#数据库初始化)
4. [Edge Functions 部署](#edge-functions-部署)
5. [环境变量配置](#环境变量配置)
6. [推送服务设置](#推送服务设置)
7. [测试验证](#测试验证)
8. [生产环境部署](#生产环境部署)

## 前置要求

- Node.js 16+
- npm 或 yarn
- Supabase CLI（可选但推荐）
- Git

## Supabase 账号设置

### 1. 创建 Supabase 账号

1. 访问 [https://supabase.com](https://supabase.com)
2. 点击 "Start your project" 注册账号
3. 选择 GitHub 或邮箱注册

### 2. 创建新项目

1. 登录后点击 "New project"
2. 填写项目信息：
   - **Project name**: `cyy-medication-app`
   - **Database Password**: 生成一个强密码并妥善保存
   - **Region**: 选择离您最近的区域
   - 美国用户推荐：`US East (N. Virginia)`
   - 亚洲用户推荐：`Southeast Asia (Singapore)`
3. 点击 "Create new project"
4. 等待项目初始化完成（约2分钟）

### 3. 获取项目凭据

项目创建完成后，在项目设置中获取以下信息：

1. 进入 Settings → API
2. 记录以下信息：
   ```
   Project URL: https://xxxxxxxxxxxxx.supabase.co
   Anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   Service role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (保密！)
   ```

## 数据库初始化

### 1. 通过 Supabase Dashboard 执行

1. 进入您的项目 Dashboard
2. 点击左侧 "SQL Editor"
3. 点击 "New query"
4. 复制 `supabase/migrations/001_initial_schema.sql` 的内容
5. 粘贴到编辑器中
6. 点击 "Run" 执行

### 2. 使用 Supabase CLI（可选）

```bash
# 安装 Supabase CLI
npm install -g supabase

# 登录
supabase login

# 链接项目
cd CYYBackend
supabase link --project-ref <your-project-ref>

# 运行迁移
supabase db push
```

## Edge Functions 部署

### 方法一：使用 Dashboard（推荐初学者）

1. 进入 Supabase Dashboard → Edge Functions
2. 点击 "New function"
3. 对于每个函数：
   - 函数名称：`send-reminder`
   - 复制 `supabase/functions/send-reminder/index.ts` 的内容
   - 点击 "Deploy"

### 方法二：使用 CLI

```bash
# 部署所有函数
cd CYYBackend
supabase functions deploy send-reminder
supabase functions deploy process-friend-request
supabase functions deploy sync-medication-status
```

### 3. 设置函数密钥

在 Dashboard → Edge Functions → 每个函数 → Settings 中添加环境变量：

```
ONESIGNAL_APP_ID=your_onesignal_app_id
ONESIGNAL_REST_API_KEY=your_onesignal_api_key
```

## 环境变量配置

### 1. 创建环境变量文件

在 `CYYMobileApp` 目录创建 `.env` 文件：

```bash
# Supabase Configuration
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OneSignal Configuration (可选)
ONESIGNAL_APP_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# 区域配置（可选）
SUPABASE_URL_ASIA=https://asia-instance.supabase.co
SUPABASE_ANON_KEY_ASIA=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. 配置 React Native

安装环境变量管理包：

```bash
cd CYYMobileApp
npm install react-native-dotenv
```

更新 `babel.config.js`：

```javascript
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: '.env',
    }],
  ],
};
```

## 推送服务设置（OneSignal）

### 1. 创建 OneSignal 账号

1. 访问 [https://onesignal.com](https://onesignal.com)
2. 注册免费账号
3. 创建新应用：
   - App name: `CYY Medication Reminder`
   - 选择 "React Native" 平台

### 2. 配置平台

#### iOS 配置：
1. 上传 APNs 证书
2. 记录 OneSignal App ID

#### Android 配置：
1. 添加 Firebase Server Key
2. 配置 Android 包名

### 3. 安装 SDK

```bash
cd CYYMobileApp
npm install react-native-onesignal
cd ios && pod install
```

## 测试验证

### 1. 测试数据库连接

运行测试脚本：

```bash
cd CYYBackend
npm run test:connection
```

### 2. 测试认证功能

```bash
npm run test:auth
```

### 3. 测试实时订阅

```bash
npm run test:realtime
```

## 生产环境部署

### 1. 启用行级安全策略（RLS）

确保所有表都启用了 RLS：

```sql
-- 在 SQL Editor 中执行
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_reminders ENABLE ROW LEVEL SECURITY;
```

### 2. 设置备份

1. 进入 Dashboard → Settings → Backups
2. 启用自动备份
3. 设置备份频率（推荐每日）

### 3. 监控设置

1. 进入 Dashboard → Reports
2. 设置告警规则
3. 配置错误通知

### 4. 多区域部署（可选）

如果需要服务中国用户：

1. 在亚洲区域创建第二个 Supabase 项目
2. 使用相同的 schema 初始化
3. 在应用中实现端点切换逻辑

## 常见问题

### Q: 如何查看 Edge Function 日志？
A: Dashboard → Edge Functions → 选择函数 → Logs

### Q: 如何更新数据库 schema？
A: 创建新的迁移文件在 `supabase/migrations/` 目录，然后执行 `supabase db push`

### Q: 如何处理 CORS 错误？
A: 在 Dashboard → Authentication → URL Configuration 中添加您的应用域名

### Q: 如何监控使用量？
A: Dashboard → Usage 查看 API 调用、存储和带宽使用情况

## 支持

- Supabase 文档：https://supabase.com/docs
- Supabase Discord：https://discord.supabase.com
- GitHub Issues：在项目仓库提交问题

## 下一步

1. 完成所有设置后，运行 `npm run verify` 验证配置
2. 在开发环境测试所有功能
3. 逐步迁移到生产环境
4. 设置 CI/CD 自动化部署

---

设置过程中如有任何问题，请参考官方文档或联系技术支持。