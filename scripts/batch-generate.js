#!/usr/bin/env node

/**
 * 批量生成教育短视频
 * 每日自动生产4个视频
 */

const fs = require('fs');
const path = require('path');
const { generateVideo, generateCover, sendToDingTalk, checkJimengService, startJimengService } = require('./generate-video');

const CONFIG = require('../config.json');

/**
 * 获取今日主题
 */
function getTodayTopics() {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const today = days[new Date().getDay()];
  return CONFIG.production_schedule.weekly_distribution[today] || ['生活口语', '旅游口语'];
}

/**
 * 生成教案
 */
function generateLessonPlan(topic, category) {
  // 这里应该调用AI生成教案
  // 为了演示，返回一个模板
  return {
    title: `20秒学会${topic}`,
    category: category,
    duration: 30,
    knowledgePoints: [
      '核心表达1',
      '核心表达2',
      '核心表达3'
    ],
    scene: '温馨咖啡厅',
    videoPrompt: generateVideoPrompt(topic, category),
    coverPrompt: generateCoverPrompt(topic, category),
    script: {
      '0-5秒': '开场白',
      '5-10秒': '知识点讲解',
      '10-15秒': '示范对话',
      '15-20秒': '重点强调',
      '20-30秒': '总结和结尾'
    }
  };
}

/**
 * 生成视频提示词
 */
function generateVideoPrompt(topic, category) {
  const scenes = {
    '生活口语': '温馨咖啡厅或家庭客厅',
    '旅游口语': '机场或酒店大堂',
    '职场口语': '现代办公室休息区',
    '英语习语': '舒适书房',
    '节日文化': '节日装饰场景',
    '语法知识点': '明亮学习空间'
  };

  const scene = scenes[category] || '温馨室内场景';

  return `温馨教育短视频，${topic}教学场景，暖色调灯光。

人物：欧美年轻女性，22-26岁，棕发微卷，笑容亲切自然，穿着浅米色针织衫配白色休闲裤，给人专业但平易近人的感觉。

场景：${scene}，生活化布置，暖色调为主（米白/浅黄/暖橙色），柔和自然光线，浅景深虚化背景，营造温馨放松的学习氛围。

镜头设计：
- 0-5秒：中景，模特微笑面对镜头，背景虚化，营造亲切感
- 5-10秒：近景，模特讲解动作，手部自然比划，表情生动
- 10-15秒：特写，展示口型发音或关键手势
- 15-20秒：中景，模特演示对话场景，侧身展示
- 20-30秒：全景，温馨结尾，出现知识点总结字幕位置

风格：照片级真实感，Instagram生活方式摄影风格，柔光照明，16:9横屏。

氛围：温暖、鼓励、亲切、让中老年学习者感到放松和自信，避免商务正式感。`;
}

/**
 * 生成封面提示词
 */
function generateCoverPrompt(topic, category) {
  return `教育短视频封面图，${topic}主题。

人物：欧美年轻女性教师形象，22-26岁，棕发，亲切微笑，穿着浅米色针织衫，手持书本或咖啡杯，自然放松的姿态。

构图：人物占据画面上半部分（约2/3），底部1/3留白用于标题文字，中景拍摄。

背景：温馨室内场景，暖色调（米色/浅黄/橙色），柔和光线，虚化处理，营造温暖亲切感。

风格：Instagram风格生活方式摄影，照片级真实感，9:16竖屏比例，适合手机观看。

氛围：温暖、亲切、专业但不严肃，让中老年学习者感到友好和可接近，吸引点击。

注意：画面底部留出足够空间放置大标题文字，背景简洁不杂乱。`;
}

/**
 * 保存教案
 */
function saveScript(script) {
  const scriptsDir = path.resolve('./scripts');
  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${timestamp}_${script.category}_${script.title.replace(/\s+/g, '_')}.json`;
  const filepath = path.join(scriptsDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(script, null, 2));
  return filepath;
}

/**
 * 主函数
 */
async function main() {
  console.log('🎬 教育短视频批量生产开始');
  console.log(`📅 今日日期: ${new Date().toLocaleDateString('zh-CN')}`);

  // 检查/启动服务
  const isRunning = await checkJimengService();
  if (!isRunning) {
    console.log('🚀 启动即梦服务...');
    const started = await startJimengService();
    if (!started) {
      console.error('❌ 无法启动即梦服务');
      process.exit(1);
    }
  }

  // 获取今日主题
  const todayTopics = getTodayTopics();
  console.log(`📚 今日主题: ${todayTopics.join(', ')}`);

  // 生产4个视频
  const productionCount = CONFIG.production_schedule.daily_count;
  const results = [];

  for (let i = 0; i < productionCount; i++) {
    console.log(`\n🎬 开始生产第 ${i + 1}/${productionCount} 个视频...`);

    const category = todayTopics[i % todayTopics.length];
    const topicExamples = CONFIG.content_categories.find(c => c.name === category)?.examples || ['实用表达'];
    const topic = topicExamples[i % topicExamples.length];

    // 生成教案
    const script = generateLessonPlan(topic, category);
    console.log(`📝 教案: ${script.title}`);

    // 保存教案
    const scriptPath = saveScript(script);
    console.log(`💾 教案已保存: ${scriptPath}`);

    try {
      // 生成视频
      console.log('⏳ 生成视频中...');
      const videoUrl = await generateVideo(script.videoPrompt, script.duration);
      console.log(`✅ 视频生成成功`);

      // 生成封面
      console.log('⏳ 生成封面图...');
      const coverUrl = await generateCover(script.coverPrompt);
      console.log(`✅ 封面生成成功`);

      // 保存结果
      const result = {
        title: script.title,
        category: script.category,
        videoUrl,
        coverUrl,
        scriptPath,
        createdAt: new Date().toISOString()
      };
      results.push(result);

      // 发送到钉钉
      await sendToDingTalk(
        script.title,
        script.category,
        videoUrl,
        coverUrl,
        script.knowledgePoints
      );

      console.log(`✅ 第 ${i + 1} 个视频生产完成！`);

      // 间隔一段时间再生产下一个（避免API限制）
      if (i < productionCount - 1) {
        console.log('⏳ 等待10秒后继续...');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    } catch (error) {
      console.error(`❌ 第 ${i + 1} 个视频生产失败:`, error.message);
    }
  }

  // 生成报告
  console.log('\n📊 生产报告');
  console.log('─'.repeat(50));
  console.log(`生产数量: ${results.length}/${productionCount}`);
  console.log(`成功率: ${(results.length / productionCount * 100).toFixed(0)}%`);
  results.forEach((r, i) => {
    console.log(`\n视频 ${i + 1}: ${r.title}`);
    console.log(`  类型: ${r.category}`);
    console.log(`  视频: ${r.videoUrl}`);
    console.log(`  封面: ${r.coverUrl}`);
  });

  // 保存批次报告
  const reportDir = path.resolve('./output/reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportPath = path.join(reportDir, `batch-report-${new Date().toISOString().split('T')[0]}.json`);
  fs.writeFileSync(reportPath, JSON.stringify({
    date: new Date().toISOString(),
    total: productionCount,
    success: results.length,
    failed: productionCount - results.length,
    results
  }, null, 2));

  console.log(`\n💾 批次报告已保存: ${reportPath}`);
  console.log('\n🎉 批量生产完成！');
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, getTodayTopics, generateLessonPlan };
