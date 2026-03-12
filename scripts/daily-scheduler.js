#!/usr/bin/env node

/**
 * 每日定时生产调度器
 * 在指定时间自动触发批量生产
 */

const { main: batchGenerate } = require('./batch-generate');
const CONFIG = require('../config.json');

/**
 * 检查当前时间是否到达生产时间
 */
function isProductionTime() {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return currentTime === CONFIG.production_schedule.schedule_time;
}

/**
 * 主循环
 */
async function scheduler() {
  console.log('⏰ 教育短视频定时生产调度器已启动');
  console.log(`🕐 生产时间: 每天 ${CONFIG.production_schedule.schedule_time}`);
  console.log(`📊 生产数量: ${CONFIG.production_schedule.daily_count} 个视频`);
  console.log('─'.repeat(50));

  // 检查是否应该立即执行（用于测试）
  const args = process.argv.slice(2);
  if (args.includes('--now') || args.includes('-n')) {
    console.log('🚀 立即执行模式');
    await batchGenerate();
    return;
  }

  // 定时检查
  setInterval(async () => {
    if (isProductionTime()) {
      console.log(`\n🎬 到达生产时间 ${CONFIG.production_schedule.schedule_time}，开始生产...`);
      console.log(`📅 ${new Date().toLocaleString('zh-CN')}`);
      console.log('─'.repeat(50));

      try {
        await batchGenerate();
      } catch (error) {
        console.error('❌ 生产失败:', error.message);
      }

      console.log('\n⏰ 等待明天同一时间...');
      console.log('─'.repeat(50));
    } else {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      process.stdout.write(`\r⏳ 当前时间: ${currentTime} | 等待 ${CONFIG.production_schedule.schedule_time}...`);
    }
  }, 60000); // 每分钟检查一次
}

// 启动调度器
scheduler().catch(console.error);

/**
 * 使用说明：
 *
 * 1. 定时模式（每天自动生产）：
 *    node daily-scheduler.js
 *
 * 2. 立即执行模式（测试用）：
 *    node daily-scheduler.js --now
 *    或
 *    node daily-scheduler.js -n
 *
 * 3. 配合 pm2 后台运行：
 *    pm2 start daily-scheduler.js --name edu-video-scheduler
 *
 * 4. 查看日志：
 *    pm2 logs edu-video-scheduler
 */
