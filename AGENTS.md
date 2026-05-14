# 加班007 - 项目记忆

## 版本历史

### v0.1.0 (当前版本)
**主题：公告系统 + Bug 上报 + 生产环境 NaN 修复**

#### 本次会话完成的改动

**1. 动态公告系统**
- **数据库**：新建 `announcements` 表（字段：`id`, `content`, `version`, `active`, `created_at`）。
- **后端**：新建 `server/routes/announcements.js`，实现 `GET /api/announcements` 接口，返回最新一条活跃公告。
- **前端**：重构 `client/src/components/AnnouncementPanel.jsx`
  - 移除硬编码，改为 `useEffect` 调用 API 获取数据。
  - 添加加载状态（"加载中..."）、错误处理（"加载失败"）和空状态（"暂无公告"）。
  - UI 显示：版本标签（如 `v0.1.0`）、公告内容、本地化时间戳。
- **预置数据**：在测试库和生产库执行 SQL 插入初始公告。

**2. Bug 上报与反馈系统**
- **数据库**：新建 `bug_reports` 表（字段：`id`, `player_id`, `description`, `status`, `created_at`）。
- **后端**：新建 `server/routes/bugs.js`，实现 `POST /api/bugs` 接口。
  - **查重逻辑**：检查玩家是否提交过完全相同的描述，防止重复刷单。
  - **长度校验**：拒绝少于 5 个字符的描述。
- **前端**：新建 `client/src/components/BugReportModal.jsx`
  - 包含多行文本输入框和提交按钮。
  - 提交成功后显示"感谢反馈"提示。
- **入口集成**：在 `AnnouncementPanel` 右上角添加 `🐛 上报 Bug` 按钮。

**3. 生产环境 NaN 崩溃修复 (v0.1.0A)**
- **问题**：生产环境 `/save` 接口持续报错 `invalid input syntax for type integer: "NaN"`。
- **根因**：之前的 `??` 运算符无法拦截 `NaN`，且 `currentSeat` 等字段缺乏严格类型检查。
- **解决**：升级 `server/routes/player.js` 的防御性逻辑。
  - 使用 `Number.isNaN(Number(val))` 显式拦截 `NaN`。
  - 对 `idleRate` 和 `bonus` 保留合法的 `0` 值，仅拦截非法 `NaN`。
  - 对 `money` 等统计字段使用 `Number(val) || 0` 进行安全回退。
  - **数据自愈**：代码修复后，玩家下次保存时会自动将数据库中的脏数据覆盖为安全默认值。

---

### v0.0.9 (上一版本)
**主题：抽卡系统重构 + 经济数值重置 + 3D 翻转动画**

#### 本次会话完成的改动

**1. 抽卡结果弹窗重构**
- 新建 `client/src/components/GachaResultModal.jsx`
  - **单抽**：显示一张大卡片居中
  - **十连抽**：显示 5x2 网格布局
  - **3D 翻转动画**：卡牌初始为灰色背面（显示"?"），翻转后显示正面结果
  - **阶梯动画**：十连抽卡牌依次翻转（间隔 0.1 秒）
  - **顶部标题**：动态显示本次最高稀有度（如 "✨ SSR!"）
  - **底部栏**：显示金币余额，提供"再来一次"和"关闭"按钮
- 修改 `client/src/components/GachaModal.jsx`
  - 移除旧的 `inventory` 相关逻辑和 UI
  - 集成新的结果弹窗
- `client/tailwind.config.js` - 添加 `flipReveal` 关键帧动画

**2. 经济数值重置**
- **挂机产出调整**：基础产出从 10 金币/秒改为 1 金币/秒（每 5 秒结算 5 金币）
- `client/src/App.jsx` - `idleRate` 默认值从 10 改为 1
- `server/models/db.js` - 建表语句 `idleRate` 默认值从 10 改为 1
- **数据库清洗**：执行 SQL 脚本重置所有玩家数据
  - `UPDATE players SET "bonus" = 1.0, "idleRate" = 1;`
  - `DELETE FROM inventory;`
  - `DELETE FROM gacha_log;`
  - `UPDATE players SET "ssrCount" = 0, "srCount" = 0, "rCount" = 0;`

**3. 代码清理与修复**
- 移除所有对已删除字段 `ticket` 和 `hair` 的引用
  - `server/routes/player.js`
  - `server/routes/seats.js`
  - `server/routes/tasks.js`
- 修复因字段缺失导致的入座报错和任务领取报错

**4. 修复后端 NaN 崩溃 (v0.0.9C)**
- `server/routes/player.js` - `/save` 路由增加防御性编程
  - 为 `idleRate` 和 `bonus` 添加默认值保护 (`|| 1`, `|| 1.0`)
  - 防止因数据库字段缺失或 `null` 导致 `Math.floor` 计算结果为 `NaN`，进而引发 PostgreSQL 类型错误 (`invalid input syntax for type integer: "NaN"`)
- `client/src/App.jsx` - 添加 `console.log` 调试日志
  - 打印服务器返回的玩家原始数据，便于排查数值异常

**5. 生产数据库修复 (v0.0.9D)**
- **问题**：部分玩家数据 `idleRate` 仍为旧值 10，导致金币产出异常 (+52/5s)
- **解决**：执行 SQL 强制更新特定玩家数据
  - `UPDATE players SET "idleRate" = 1, "bonus" = 1.0 WHERE "id" = '...';`
- **教训**：代码默认值修复了崩溃，但数据清洗需确保覆盖所有活跃玩家

**6. 修复抽奖结果动画反复播放 (v0.0.9E)**
- **问题**：抽奖结果弹窗的卡牌翻转动画会因金币增长导致父组件重渲染而反复播放。
- **原因**：`Card` 组件定义在 `GachaResultModal` 函数内部，导致每次父组件更新时子组件被销毁并重新挂载。
- **解决**：将 `Card` 组件及 `getRarityStyle` 函数提取到 `GachaResultModal` 外部（模块作用域），防止不必要的重新挂载。
- **文件**：`client/src/components/GachaResultModal.jsx`

---

### v0.0.8 (上一版本)
**主题：NPC 系统 + 上班打卡 + 坐牢按钮优化**

#### 本次会话完成的改动

**1. NPC 蒸馏桃子盒子**
- 新建 `client/src/components/NPCPeachBox.jsx` - NPC 主组件
  - 使用自定义图片 `peach-box-npc.png`（120px 宽度）
  - 随机间隔 10-20 秒触发气泡
  - 气泡显示 6 秒后消失
  - 漫画式气泡样式（带尾巴指向 NPC）
- 新建 `client/src/data/npcDialogues.js` - 10 句气泡台词配置
- `client/src/components/IdleHall.jsx` - 集成 NPC 组件到工位区域右上角
- `client/tailwind.config.js` - 添加 `fadeInOut` 气泡动画

**2. 每日任务改为上班打卡**
- `client/src/App.jsx` - 按钮文字"每日任务"→"上班打卡"
- `client/src/components/TaskPanel.jsx` - 弹窗标题"每日任务"→"上班打卡"

**3. 坐牢按钮 emoji**
- `client/src/App.jsx` - "坐牢中..."按钮添加 `🚔` 警车 emoji

---

### v0.0.7 (上一版本)
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
- **部署**: Render (Starter Plan, $7/月)
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
- **蒸馏桃子盒子对话弹窗**：点击 NPC 弹出对话窗口
  - 当前仅显示随机气泡
  - 后续迭代：点击 NPC 打开对话面板，显示更多互动内容
- **跨服通讯贝**：实时聊天/留言板功能
  - 当前占位："以太乱流，暂时无法连接"
  - 需后端 WebSocket 支持
- **金蝶游乐场**：小游戏投放区域
  - 当前占位："投资招商中..."
  - 需设计游戏机制和交互逻辑
- **离线收益**：玩家关闭页面后重新登录时，计算并提示领取离线期间收益
  - 后端接口已存在：`GET /player/:id/offline-earnings` 和 `POST /player/:id/claim-offline`
  - 前端需添加：登录时弹窗提示 + 领取按钮

---

## 🌿 分支开发规范 (v0.1.0)

### 1. 分支策略
项目采用简化的 Gitflow 工作流，以保障生产环境稳定性：

| 分支名称 | 用途 | 稳定性 | 部署目标 |
| :--- | :--- | :--- | :--- |
| **`main`** | **生产环境**：仅包含经过测试的稳定代码。 | ✅ 稳定 | Render 生产服务 (`zero07-ltd-2`) |
| **`develop`** | **开发环境**：集成所有新功能，用于内部测试。 | ⚠️ 测试中 | Render 测试服务 (`jiaban007-staging`) |
| **`feature/*`** | **功能开发**：针对具体功能（如 `feature/offline-earnings`）。 | 🚧 开发中 | 本地开发 |

### 2. 开发工作流
1.  **开发新功能**：
    *   从 `develop` 创建功能分支：`git checkout -b feature/新功能 develop`。
    *   在功能分支上编写代码，完成后合并回 `develop`。
2.  **测试验证**：
    *   访问 **Staging 网址** 进行测试。
    *   确认功能正常且无 Bug。
3.  **发布上线**：
    *   将 `develop` 合并到 `main`：`git checkout main && git merge develop`。
    *   推送到 GitHub：`git push origin main`。
    *   Render 的 **生产服务** 会自动检测到 `main` 的更新并重新部署。

### 3. 多电脑开发注意事项
由于存在 **公司** 和 **家里** 两个开发环境，请严格遵守以下同步规范：

*   **开始工作前**：无论在哪台电脑，第一件事永远是 `git pull origin develop`，确保拿到最新代码。
*   **结束工作后**：`git push origin develop`，确保代码上传到云端。
*   **本地环境变量**：
    *   每台电脑的 `server/.env` 应独立配置，**切勿提交到 Git**。
    *   本地开发建议连接 **测试数据库**，严禁在本地连接生产数据库，防止误操作导致数据丢失。

### 4. 数据库管理
*   **生产数据库**：Supabase Project `jiaban007` (ID: `cxahyurmtcsrifiqoyez`)
*   **测试数据库**：Supabase Project `jiaban007-test` (ID: `chdwnashqoxybcbipthk`)
*   **⚠️ 警告**：在进行数据库结构变更（如 `ALTER TABLE`）时，务必先在测试库执行，验证无误后，**必须**在生产库同步执行，否则会导致上线后代码报错。
