-- 修复 PostgreSQL 字段名大小写问题 (v0.0.9E)
-- 原因：CREATE TABLE 时驼峰字段未加双引号，导致 PostgreSQL 自动转为全小写。
-- 影响：新创建的数据库（如测试库）会出现 "column does not exist" 错误。

ALTER TABLE players RENAME COLUMN idlerate TO "idleRate";
ALTER TABLE players RENAME COLUMN currentseat TO "currentSeat";
ALTER TABLE players RENAME COLUMN seatcooldown TO "seatCooldown";
ALTER TABLE players RENAME COLUMN totalidletime TO "totalIdleTime";
ALTER TABLE players RENAME COLUMN totalmoneyearned TO "totalMoneyEarned";
ALTER TABLE players RENAME COLUMN totalgachacount TO "totalGachaCount";
ALTER TABLE players RENAME COLUMN lastsave TO "lastSave";
ALTER TABLE players RENAME COLUMN createdat TO "createdAt";
