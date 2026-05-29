-- 检查 pgmigrations 表确认迁移执行状态
-- 在 Supabase SQL Editor 中执行此查询

SELECT * FROM pgmigrations ORDER BY id DESC LIMIT 10;

-- 预期结果：
-- 如果 020 在列表中，说明迁移曾被标记为"已执行"
-- 如果 020 不在列表中，说明迁移从未执行
-- 如果 020 在列表中但数据未更新，说明迁移 SQL 执行失败但状态被错误标记
