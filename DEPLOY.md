# 加班007 部署指南

## 本地启动
双击桌面上的「加班007」快捷方式，或双击项目目录下的 启动游戏.bat

## Railway 云端部署步骤

### 1. 准备 GitHub 仓库
`ash
cd F:\AI开发\加班007
git init
git add .
git commit -m "Initial commit"
# 在 GitHub 创建新仓库后添加远程
git remote add origin https://github.com/你的用户名/jiaban007.git
git push -u origin main
`

### 2. Railway 部署
1. 访问 https://railway.app 并注册
2. 点击 "New Project" → "Deploy from GitHub repo"
3. 选择 jiaban007 仓库
4. Railway 会自动检测并部署

### 3. 获取固定网址
部署成功后，Railway 会分配一个固定网址：
https://jiaban007-production-xxxx.up.railway.app

你可以：
- 直接使用这个网址（永久有效）
- 在 Railway 设置中绑定自定义域名

### 4. 后续更新
每次 push 到 GitHub main 分支，Railway 会自动重新部署

## 文件说明
- 启动游戏.bat - 本地启动脚本
- Procfile - Railway 启动配置
- server/server.js - 后端服务（同时 serve 前端）
- client/dist/ - 前端构建产物
