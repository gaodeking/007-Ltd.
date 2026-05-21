/**
 * 北京时间 (UTC+8) 工具函数
 * Render 服务器默认使用 UTC，需要转换为北京时间以匹配中国用户习惯
 */

/**
 * 获取北京时间的日期字符串 (YYYY-MM-DD)
 */
function getBeijingDate() {
  const now = new Date();
  // UTC+8: 将 UTC 时间加上 8 小时
  const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return beijingTime.toISOString().split('T')[0];
}

/**
 * 获取北京时间的月份字符串 (YYYY-MM)
 */
function getBeijingMonth() {
  const now = new Date();
  const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return beijingTime.toISOString().slice(0, 7);
}

/**
 * 获取北京时间当前月份的天数
 */
function getDaysInBeijingMonth() {
  const now = new Date();
  const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const year = beijingTime.getUTCFullYear();
  const month = beijingTime.getUTCMonth(); // 0-indexed
  return new Date(year, month + 1, 0).getDate();
}

module.exports = {
  getBeijingDate,
  getBeijingMonth,
  getDaysInBeijingMonth
};
