# 加班007 - 项目记忆

## 版本历史

### v0.0.5B (当前版本)
**主题：修复 PostgreSQL 字段名大小写问题**

#### 问题描述
- 部署到 Render 后前端报错：`Cannot read properties of undefined (reading 'toString')`
- 根本原因：PostgreSQL 会将未加双引号的驼峰字段名（如 `seatId`）自动转换为小写（`seatid`）
- 前端代码期望驼峰命名，但数据库返回小写字段名，导致 `seat.seatId` 为 `undefined`

#### 已完成改动
1. **数据库表结构修复**
   - `server/models/db.js` - 所有 CREATE TABLE 语句的字段名添加双引号，保持驼峰命名
   - 例如：`"seatId" INTEGER PRIMARY KEY` 而非 `seatId INTEGER PRIMARY KEY`

2. **路由查询语句修复**
   - `server/routes/player.js` - SELECT/UPDATE 语句显式指定驼峰字段名（加双引号）
   - `server/routes/seats.js` - GET /seats 查询使用字段别名保持驼峰命名
   - `server/routes/gacha.js` - 所有 inventory/gacha_log 相关查询修复字段名
   - `server/routes/tasks.js` - daily_tasks/player_tasks 查询修复字段名

3. **版本号更新**
   - `package.json` - 版本更新为 `0.0.5B`（B 表示家庭开发环境分支）

#### 注意事项
- 已部署的 Supabase 数据库需要手动运行 ALTER TABLE 语句重命名字段
- 新部署会自动使用正确的双引号字段名

---

### v0.0.4 (上一版本)
**主题：数据库迁移到 PostgreSQL + Render 云端部署 + 本地启动优化**

#### 已完成改动
1. **数据库迁移 (sql.js → pg)**
   - `server/models/db.js` - 完全重写，使用 `pg` 库连接 PostgreSQL，保持 `get()`, `all()`, `run()` 接口不变
   - `server/package.json` - 添加 `pg` 依赖，移除 `sql.js`
   - 所有 SQL 语法从 SQLite 改为 PostgreSQL（`strftime` → `EXTRACT(EPOCH FROM NOW())`，`AUTOINCREMENT` → `SERIAL`）
   - 占位符从 `?` 改为 `$1, $2, ...`

2. **路由文件 async/await 改造**
   - `server/routes/player.js` - 所有路由改为 async，添加错误处理
   - `server/routes/seats.js` - 所有路由改为 async，添加错误处理
   - `server/routes/gacha.js` - 所有路由改为 async，添加错误处理
   - `server/routes/tasks.js` - 所有路由改为 async，添加错误处理

3. **服务器适配生产环境**
   - `server/server.js` - 移除 Windows 特有的 `exec('start ...')` 自动打开浏览器逻辑
   - 监听 `0.0.0.0` 而非 `localhost`
   - 添加 Render 环境变量检测 (`RENDER_EXTERNAL_HOSTNAME`)
   - 添加错误捕获和优雅退出

4. **本地启动优化**
   - `启动游戏.bat` - 同时启动前端 (Vite dev server) 和后端 (Express)，前端先启动，2秒后启动后端

5. **部署配置**
   - `package.json` (根目录) - 优化 `build` 脚本：`cd client && npm install && npx vite build`
   - `render.yaml` - Render 一键部署配置
   - `server/.env.example` - 本地开发环境变量模板
   - `.gitignore` - 添加 `server/.env` 忽略

6. **依赖问题修复**
   - `client/package.json` - 将 `vite`, `@vitejs/plugin-react` 等构建工具从 `devDependencies` 移至 `dependencies`
   - 原因：Render 生产环境 `NODE_ENV=production` 不安装 `devDependencies`

7. **网络连接问题修复**
   - `server/models/db.js` - 添加 `family: 4` 强制使用 IPv4
   - 使用 Supabase Session Pooler 连接字符串（IPv4 代理）
   - 原因：Render 免费实例不支持 IPv6

8. **前端错误处理优化**
   - `client/src/App.jsx` - 添加加载状态和错误提示界面
   - `client/vite.config.js` - 添加 `base: './'` 确保资源路径正确

9. **React 错误边界**
   - `client/src/components/ErrorBoundary.jsx` - 新建，捕获渲染错误，显示友好提示
   - `client/src/App.jsx` - 使用 ErrorBoundary 包裹主应用

10. **前端 undefined 属性访问修复**
    - `client/src/components/IdleHall.jsx` - `seatCooldown` 添加默认值 `0`
    - `client/src/components/CurrencyBar.jsx` - `money`/`ticket`/`hair` 添加默认值
    - `client/src/components/StatusBar.jsx` - `idleRate`/`bonus` 添加默认值
    - `client/src/components/AdventurerBar.jsx` - `name` 添加默认值

11. **Player 数据初始化增强**
    - `client/src/App.jsx` - 为 player 数据添加完整默认值，防止字段缺失导致崩溃

#### 核心需求
- **永久网址**：朋友通过 Render 分配的固定网址直接加入游戏
- **数据持久化**：使用 Supabase PostgreSQL 保存游戏数据，重新部署不丢失
- **本地快速启动**：双击 `启动游戏.bat` 同时启动前后端

#### 部署流程
1. 创建 Supabase 项目获取 `DATABASE_URL`（使用 Session Pooler 连接字符串）
2. 访问 https://render.com/deploy?repo=https://github.com/gaodeking/007-Ltd.
3. 填入 `DATABASE_URL` 环境变量（注意 URL 编码特殊字符如 `@` → `%40`）
4. Render 自动构建并部署

#### 本地开发
- 双击 `启动游戏.bat` 启动
- 前端: http://localhost:3000
- 后端: http://localhost:3001
- 需要设置 `server/.env` 中的 `DATABASE_URL`

#### 已知问题
- Render 免费实例 15 分钟无访问会自动休眠，下次访问会重新唤醒（延迟约 50 秒）
- 必须使用 Supabase Session Pooler 连接字符串（IPv4），Direct Connection 会因 IPv6 失败

---

### v0.0.3
- 基础版本：Express 后端 + Vite/React 前端
- 使用 sql.js (SQLite 内存数据库)
- 功能：玩家系统、座位系统、抽奖系统、每日任务

---

## 技术栈
- **前端**: React 18 + Vite 5 + Tailwind CSS 3 + Axios
- **后端**: Express 4 + pg (PostgreSQL)
- **数据库**: PostgreSQL (Supabase Session Pooler)
- **部署**: Render (Web Service Free Tier)
- **代码仓库**: https://github.com/gaodeking/007-Ltd.
- **当前网址**: https://zero07-ltd-2.onrender.com

## 项目结构
```
加班007/
├── client/                 # 前端
│   ├── src/               # React 源码
│   │   ├── api/           # API 请求封装
│   │   ├── components/    # React 组件
│   │   ├── App.jsx        # 主应用组件
│   │   └── main.jsx       # 入口文件
│   ├── dist/              # 构建产物（部署时生成）
│   └── package.json
├── server/                 # 后端
│   ├── models/db.js       # 数据库连接（pg）
│   ├── routes/            # API 路由
│   │   ├── player.js      # 玩家相关
│   │   ├── seats.js       # 座位相关
│   │   ├── gacha.js       # 抽奖相关
│   │   └── tasks.js       # 任务相关
│   ├── config/            # 配置文件
│   └── package.json
├── package.json           # 根目录脚本
├── render.yaml            # Render 部署配置
├── 启动游戏.bat           # 本地启动脚本
── AGENTS.md              # 项目记忆文件
└── .gitignore
```

---

## ⚠️ 不确定标记（需后续确认）
- **后端验证逻辑**：当前 save 接口取前端值和后端计算值的较大者，可能需要调整为强制使用后端计算值或其他策略
- **初始金币 100**：数值待经济系统平衡后调整

## 🔥 火烧眉毛待办项（高优先级）
- **座位状态未重置问题**：玩家下线后座位状态未释放，导致"幽灵占用"
  - 原因：无页面关闭清理机制 + 无心跳超时检测
  - 待实施方案：前端 beforeunload + sendBeacon + 后端心跳超时检测
- **产出消耗数值平衡**：
  - 挂机产出：10 金币/秒 × 5 秒 = 50 金币/次
  - 抽奖消耗：100 金币/次
  - 需要 2 次挂机（10 秒）才能抽奖 1 次
  - 需评估：产出/消耗比例是否合理？是否需要调整 idleRate 或抽奖成本？
- **经济系统闭环设计**：
  - 产出端：挂机金币、任务奖励、离线收益
  - 消耗端：抽奖、道具购买、座位升级（未来）
  - 需要设计完整的金币循环，防止通货膨胀或通货紧缩

## 📋 待开发功能
- **离线收益**：玩家关闭页面后重新登录时，计算并提示领取离线期间收益
  - 后端接口已存在：`GET /player/:id/offline-earnings` 和 `POST /player/:id/claim-offline`
  - 前端需添加：登录时弹窗提示 + 领取按钮
