# 数据库迁移记录

## 执行状态
- [x] 001_add_avatar_field.sql - 已执行 (2026-05-13)
- [x] 002_add_gacha_counts.sql - 已执行 (2026-05-13)
- [x] 003_reset_economy.sql - 已执行 (2026-05-13)
- [x] 004_add_lastheartbeat.sql - 已执行 (2026-05-13)
- [x] 005_fix_column_casing.sql - 已执行 (2026-05-14)

## 执行方式
在 Supabase SQL Editor 中依次执行未标记的迁移脚本。

## 数据同步与自动比对流程
每次手动复制数据后，执行以下步骤确保一致性：
1. **手动复制**：在 Supabase 控制台打开正式库，进入 Table Editor，全选数据行 `Ctrl+A` -> `Ctrl+C`，切换到测试库对应表，`Ctrl+V` 粘贴。
2. **自动比对**：运行以下命令自动检查关键表行数是否一致：
   ```bash
   node scripts/compare-db.js "<正式库_DATABASE_URL>" "<测试库_DATABASE_URL>"
   ```
3. **确认记录**：比对通过后，在下方同步记录表中登记时间。

## 同步记录
| 日期 | 操作人 | 备注 |
|------|--------|------|
| 2026-05-14 | HomeDev | 初始同步 |
