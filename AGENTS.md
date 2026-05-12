# 加班007 - 项目记忆

## 版本历史

### v0.0.4 (当前版本)
**主题：数据库迁移到 PostgreSQL + Render 云端部署 + 本地启动优化**

#### 已完成改动
1. **数据库迁移 (sql.js → pg)**
   - `server/models/db.js` - 完全重写，使用 `pg` 库连接 PostgreSQL，保持 `get()`, `all()`, `run()` 接口不变
   - `server/package.json` - 添加 `pg` 依赖，移除 `sql.js`
   - 所有 SQL 语法从 SQLite 改为 PostgreSQL（`strftime` → `EXTRACT(EPOCH FROM NOW())`，`AUTOINCREMENT` → `SERIAL`）

2. **路由文件 async/await 改造**
   - `server/routes/player.js` - 所有路由改为 async，添加错误处理
   - `server/routes/seats.js` - 所有路由改为 async，添加错误处理
   - `server/routes/gacha.js` - 所有路由改为 async，添加错误处理
   - `server/routes/tasks.js` - 所有路由改为 async，添加错误处理

3. **服务器适配生产环境**
   - `server/server.js` - 移除 Windows 特有的 `exec('start ...')` 自动打开浏览器逻辑
   - 监听 `0.0.0.0` 而非 `localhost`
   - 添加 Render 环境变量检测 (`RENDER_EXTERNAL_HOSTNAME`)

4. **本地启动优化**
   - `启动游戏.bat` - 同时启动前端 (Vite dev server) 和后端 (Express)，前端先启动，2秒后启动后端

5. **部署配置**
   - `package.json` (根目录) - 优化 `build` 脚本：`cd client && npm install && npx vite build`
   - `render.yaml` - Render 一键部署配置，包含 Web Service + PostgreSQL
   - `server/.env.example` - 本地开发环境变量模板
   - `.gitignore` - 添加 `server/.env` 忽略

#### 核心需求
- **永久网址**：朋友通过 Render 分配的固定网址直接加入游戏
- **数据持久化**：使用 Supabase PostgreSQL 保存游戏数据，重新部署不丢失
- **本地快速启动**：双击 `启动游戏.bat` 同时启动前后端

#### 部署流程
1. 创建 Supabase 项目获取 `DATABASE_URL`
2. 访问 https://render.com/deploy?repo=https://github.com/gaodeking/007-Ltd.
3. 填入 `DATABASE_URL` 环境变量
4. Render 自动构建并部署

#### 本地开发
- 双击 `启动游戏.bat` 启动
- 前端: http://localhost:3000
- 后端: http://localhost:3001
- 需要设置 `server/.env` 中的 `DATABASE_URL`

---

### v0.0.3
- 基础版本：Express 后端 + Vite/React 前端
- 使用 sql.js (SQLite 内存数据库)
- 功能：玩家系统、座位系统、抽奖系统、每日任务

---

## 技术栈
- **前端**: React 18 + Vite 5 + Tailwind CSS 3 + Axios
- **后端**: Express 4 + pg (PostgreSQL)
- **数据库**: PostgreSQL (Supabase 或 Render PostgreSQL)
- **部署**: Render (Web Service + Database)
- **代码仓库**: https://github.com/gaodeking/007-Ltd.

## 项目结构
```
加班007/
├── client/                 # 前端
│   ├── src/               # React 源码
│   ├── dist/              # 构建产物（部署时生成）
│   └── package.json
├── server/                 # 后端
│   ├── models/db.js       # 数据库连接
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
└── .gitignore
```
