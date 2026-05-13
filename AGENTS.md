# 加班007 - 项目记忆

## 版本历史

### v0.0.7 (当前版本)
**主题：UI 界面重构 - 三栏布局 + 玩家信息卡片**

#### 本次会话完成的改动

**1. 布局重构**
- `client/src/App.jsx` - 移除 AdventurerBar，重构为三栏 Grid 布局
  - 左侧栏：跨服通讯贝（20% 宽度）
  - 中间栏：007公司工位 + 光之冒险（55% 宽度）
  - 右侧栏：玩家信息卡片 + 公告 + 金蝶游乐场（25% 宽度）
- 主容器添加 `min-width: 1200px`，暂不适配移动端

**2. 新建组件**
- `client/src/components/ChatSidebar.jsx` - 跨服通讯贝（占位："以太乱流，暂时无法连接"）
- `client/src/components/PlayerInfoCard.jsx` - 玩家信息卡片
  - 左侧圆形头像（60x60px）
  - 右侧玩家名称 + "修改信息"按钮
  - 底部金币信息条（含金币增长动态效果）
- `client/src/components/AnnouncementPanel.jsx` - 公告面板（占位："这是一个公告"）
- `client/src/components/ArcadePanel.jsx` - 金蝶游乐场（占位："投资招商中..."）

**3. 修改组件**
- `client/src/components/CurrencyBar.jsx` - 移除金币显示，仅保留标题
- `client/src/components/IdleHall.jsx` 
  - 标题改为"007公司工位"
  - 删除底部图例说明（🧙 = 你 / ⚔️ = 其他冒险者 / ️ = 空床位）
  - 适配新布局（移除 max-w-4xl）
- `client/src/components/ActivityPanel.jsx` - 适配 Grid 布局，改为 3 列网格

**4. 按钮样式**
- `client/src/App.jsx` - "坐牢中..."按钮添加深绿色边框 `ring-2 ring-[#2d5a2d]`

**5. 金币动态效果迁移**
- 从 CurrencyBar 迁移到 PlayerInfoCard
- 保持原有逻辑：每 5 秒金币增长时显示绿色 `+50` 浮动动画

---

### v0.0.6A (上一版本)
**主题：冒险者头像系统**

#### 本次会话完成的改动

**1. 数据库迁移**
- 已执行 Supabase SQL：`ALTER TABLE players ADD COLUMN IF NOT EXISTS "avatar" TEXT DEFAULT '🧙‍♂️';`
- `server/models/db.js` - 在建表语句中添加 `avatar` 字段

**2. 后端 API**
- `server/routes/player.js` - 新增 `PUT /player/:id/avatar` 接口，支持更新玩家头像

**3. 前端交互**
- `client/src/api/index.js` - 添加 `updateAvatar` 方法
- `client/src/components/ProfileModal.jsx` - 添加 3×5 头像选择网格
  - 15 个预设 Emoji（法师、精灵、吸血鬼、僵尸、人鱼、仙子、蒸汽浴、攀岩、杂耍、瑜伽、巨龙、狐狸、猫咪、狗狗、狮子）
  - 鼠标悬停显示名称，点击选中高亮
  - 点击立即调用 API 保存

**4. 前端显示**
- `client/src/components/AdventurerBar.jsx` - 顶部栏显示玩家头像
- `client/src/components/IdleHall.jsx` - 座位图标优先显示玩家头像

**5. 状态同步**
- `client/src/App.jsx` - 初始化 `avatar` 默认值，处理更新逻辑

---

### v0.0.5B (上一版本)
**主题：家庭开发环境迭代 - UI 重构 + 金币系统 + 座位优化**

#### 本次会话完成的改动

**1. 修复 PostgreSQL 字段名大小写问题**
- `server/models/db.js` - 所有 CREATE TABLE 语句的字段名添加双引号，保持驼峰命名
- `server/routes/player.js` - SELECT/UPDATE 语句显式指定驼峰字段名（加双引号）
- `server/routes/seats.js` - GET /seats 查询使用字段别名保持驼峰命名
- `server/routes/gacha.js` - 所有 inventory/gacha_log 相关查询修复字段名
- `server/routes/tasks.js` - daily_tasks/player_tasks 查询修复字段名
- 已执行 Supabase ALTER TABLE 语句重命名现有字段

**2. 页面 UI 重构**
- `client/src/App.jsx` - 添加核心操作栏（入座休息/召唤之门/每日任务三按钮）
- `client/src/App.jsx` - 主背景色改为 `#f0ebe5`（浅米色）
- `client/src/components/CurrencyBar.jsx` - 布局调整：标题居左，金币居右，移除门票/钻石显示
- `client/src/components/ActivityPanel.jsx` - 改名"光之冒险"
- 全局文字颜色优化：主要文字 `#4a3a3a`，次要文字 `#6b5b5b`，边框 `#d4c8c8`

**3. 金币增长系统**
- `client/src/App.jsx` - 添加金币增长定时器（每 5 秒自动增长）
- `server/routes/player.js` - save 接口添加后端验证逻辑（取前端值和后端计算值的较大者）
- `server/models/db.js` - 新玩家初始金币默认值改为 100
- 计算公式：`earningsPerTick = idleRate × bonus × 5`

**4. 金币动态效果**
- `client/src/components/CurrencyBar.jsx` - 金币字号放大至 `text-2xl`
- `client/tailwind.config.js` - 添加 `floatUp` 自定义动画
- 每 5 秒金币增长时显示绿色 `+50` 浮动动画（向上移动 20px 并淡出）

**5. 修复金币保存问题**
- `client/src/App.jsx` - 使用 `useRef` 存储 player 状态，避免 auto-save 定时器被频繁重置
- `client/src/App.jsx` - 添加 `beforeunload` 事件监听，页面关闭时通过 `sendBeacon` 保存数据
- `client/src/components/CurrencyBar.jsx` - 修复 +50 动画不显示问题（使用 `earnTrigger` 计数器而非依赖 `earnings` 值）

**6. 修复座位幽灵占用 + 换座冷却优化**
- `server/models/db.js` - 添加 `lastHeartbeat` 字段（INTEGER DEFAULT 0）
- `client/src/api/index.js` - 添加 `heartbeat` API
- `client/src/App.jsx` - 添加心跳定时器（每 15 秒发送一次，仅在座时）
- `client/src/App.jsx` - 添加 `beforeunload` 释放座位逻辑（sendBeacon 调用 `/seats/leave`）
- `server/routes/player.js` - 添加 `/heartbeat` 接口
- `server/routes/seats.js` - 添加超时检测逻辑（30 秒无心跳自动释放座位）
- `server/routes/seats.js` - 换座冷却从 300 秒（5 分钟）改为 2 秒
  - `FIRST_SIT_COOLDOWN = 2`（首次入座）
  - `CHANGE_SEAT_COOLDOWN = 2`（换座）
  - `LEAVE_SEAT_COOLDOWN = 2`（离开）
- `server/routes/seats.js` - 错误提示改为"别急，屁股还没坐热呢"

#### 数据库迁移
- 已执行 Supabase SQL：`ALTER TABLE players ADD COLUMN IF NOT EXISTS "lastHeartbeat" INTEGER DEFAULT 0;`

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

## 🔥 火烧眉毛待办项（高优先级）
- **产出消耗数值平衡**：
  - 挂机产出：10 金币/秒 × 5 秒 = 50 金币/次
  - 抽奖消耗：100 金币/次
  - 需要 2 次挂机（10 秒）才能抽奖 1 次
  - 需评估：产出/消耗比例是否合理？是否需要调整 idleRate 或抽奖成本？
- **经济系统闭环设计**：
  - 产出端：挂机金币、任务奖励、离线收益
  - 消耗端：抽奖、道具购买、座位升级（未来）
  - 需要设计完整的金币循环，防止通货膨胀或通货紧缩

##  待开发功能
- **移动端适配**：响应式布局适配小屏幕设备
  - 当前布局设置 `min-width: 1200px`，小屏幕需横向滚动
  - 计划：大屏三栏，中屏双栏，小屏单栏垂直堆叠
- **跨服通讯贝**：实时聊天/留言板功能
  - 当前占位："以太乱流，暂时无法连接"
  - 需后端 WebSocket 支持
- **金蝶游乐场**：小游戏投放区域
  - 当前占位："投资招商中..."
  - 需设计游戏机制和交互逻辑
- **公告系统**：发布更新公告和随机新闻
  - 当前占位："这是一个公告"
  - 阶段 1：前端硬编码公告内容
  - 阶段 2：后端 API + 数据库动态管理
- **离线收益**：玩家关闭页面后重新登录时，计算并提示领取离线期间收益
  - 后端接口已存在：`GET /player/:id/offline-earnings` 和 `POST /player/:id/claim-offline`
  - 前端需添加：登录时弹窗提示 + 领取按钮
