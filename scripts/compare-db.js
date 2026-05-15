const { Client } = require('pg');

async function compareDatabases(prodUrl, testUrl) {
  const prod = new Client({ connectionString: prodUrl, ssl: { rejectUnauthorized: false } });
  const test = new Client({ connectionString: testUrl, ssl: { rejectUnauthorized: false } });
  
  const tables = ['players', 'seats', 'inventory', 'gacha_log', 'daily_tasks', 'player_tasks'];
  
  try {
    await prod.connect();
    await test.connect();
    
    console.log('🔍 开始比对数据库...\n');
    let allMatch = true;
    
    for (const table of tables) {
      try {
        const prodRes = await prod.query(`SELECT COUNT(*) FROM "${table}"`);
        const testRes = await test.query(`SELECT COUNT(*) FROM "${table}"`);
        const prodCount = parseInt(prodRes.rows[0].count);
        const testCount = parseInt(testRes.rows[0].count);
        
        const match = prodCount === testCount;
        if (!match) allMatch = false;
        console.log(`${match ? '✅' : '❌'} ${table.padEnd(15)} 生产库: ${prodCount} | 测试库: ${testCount}`);
      } catch (err) {
        console.log(`⚠️  ${table.padEnd(15)} 表不存在或查询失败`);
      }
    }
    
    console.log(allMatch ? '\n🎉 数据同步一致！可以开始开发。' : '\n❌ 数据不一致，请检查 Supabase 复制过程。');
  } catch (err) {
    console.error('❌ 连接失败:', err.message);
  } finally {
    await prod.end();
    await test.end();
  }
}

const args = process.argv.slice(2);
if (args.length !== 2) {
  console.log('用法: node scripts/compare-db.js <PROD_DATABASE_URL> <TEST_DATABASE_URL>');
  process.exit(1);
}

compareDatabases(args[0], args[1]);
