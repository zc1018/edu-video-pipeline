#!/usr/bin/env node

/**
 * 教育短视频生成脚本
 * 自动化流程：教案 → 提示词 → 视频 → 封面 → 钉钉推送
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置
const CONFIG = require('../config.json');
const JIMENG_API = CONFIG.jimeng_api;

/**
 * 检查即梦服务状态
 */
async function checkJimengService() {
  try {
    const response = await fetch(`${JIMENG_API.base_url}/ping`);
    const text = await response.text();
    return text === 'pong';
  } catch (error) {
    return false;
  }
}

/**
 * 启动即梦服务
 */
function startJimengService() {
  console.log('🚀 启动即梦服务...');
  try {
    execSync(`cd ${JIMENG_API.project_path} && npm start`, {
      detached: true,
      stdio: 'ignore'
    });
    console.log('✅ 服务启动命令已执行');

    // 等待服务启动
    let retries = 10;
    while (retries > 0) {
      try {
        execSync(`curl -s ${JIMENG_API.base_url}/ping`);
        console.log('✅ 服务已就绪');
        return true;
      } catch {
        retries--;
        console.log(`⏳ 等待服务启动... (${10 - retries}/10)`);
        execSync('sleep 1');
      }
    }
    throw new Error('服务启动超时');
  } catch (error) {
    console.error('❌ 服务启动失败:', error.message);
    return false;
  }
}

/**
 * 生成视频
 */
async function generateVideo(prompt, duration = 30) {
  console.log('🎬 开始生成视频...');

  const requestBody = {
    model: JIMENG_API.video_model,
    messages: [
      {
        role: 'user',
        content: `${prompt}, ${duration}秒`
      }
    ]
  };

  try {
    const response = await fetch(`${JIMENG_API.base_url}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JIMENG_API.token}`
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (data.choices && data.choices[0] && data.choices[0].message) {
      const content = data.choices[0].message.content;
      // 提取视频链接
      const videoUrls = content.match(/https:\/\/[^\s\)]+/g);
      if (videoUrls && videoUrls.length > 0) {
        console.log('✅ 视频生成成功');
        return videoUrls[0];
      }
    }

    throw new Error('未能从响应中提取视频链接');
  } catch (error) {
    console.error('❌ 视频生成失败:', error.message);
    throw error;
  }
}

/**
 * 生成封面图
 */
async function generateCover(prompt) {
  console.log('🖼️ 开始生成封面图...');

  const requestBody = {
    model: JIMENG_API.image_model,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  };

  try {
    const response = await fetch(`${JIMENG_API.base_url}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JIMENG_API.token}`
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (data.choices && data.choices[0] && data.choices[0].message) {
      const content = data.choices[0].message.content;
      // 提取图片链接
      const imageUrls = content.match(/https:\/\/[^\s\)]+/g);
      if (imageUrls && imageUrls.length > 0) {
        console.log('✅ 封面生成成功');
        return imageUrls[0];
      }
    }

    throw new Error('未能从响应中提取图片链接');
  } catch (error) {
    console.error('❌ 封面生成失败:', error.message);
    throw error;
  }
}

/**
 * 发送到钉钉
 */
async function sendToDingTalk(title, category, videoUrl, coverUrl, knowledgePoints) {
  console.log('📤 发送到钉钉...');

  const webhookUrl = CONFIG.dingtalk.webhook_url;
  if (!webhookUrl) {
    console.log('⚠️ 未配置钉钉Webhook，跳过发送');
    return;
  }

  const now = new Date().toLocaleString('zh-CN');
  const knowledgeList = knowledgePoints.map(kp => `- ${kp}`).join('\n');

  const message = {
    msgtype: 'markdown',
    markdown: {
      title: '📹 教育短视频生产完成',
      text: `### 📹 教育短视频生产完成\n\n**视频标题**：${title}\n\n**主题类型**：${category}\n\n**视频链接**：[点击下载](${videoUrl})\n\n**封面链接**：[点击下载](${coverUrl})\n\n**教学知识点**：\n${knowledgeList}\n\n---\n⏰ 生成时间：${now}`
    }
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });

    if (response.ok) {
      console.log('✅ 钉钉推送成功');
    } else {
      console.error('❌ 钉钉推送失败:', await response.text());
    }
  } catch (error) {
    console.error('❌ 钉钉推送失败:', error.message);
  }
}

/**
 * 保存结果
 */
function saveResult(title, category, videoUrl, coverUrl, script) {
  const outputDir = path.resolve(CONFIG.output_settings.save_directory);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().split('T')[0];
  const safeTitle = title.replace(/[^\w\u4e00-\u9fa5]/g, '_');
  const filename = `${timestamp}_${category}_${safeTitle}.json`;
  const filepath = path.join(outputDir, filename);

  const result = {
    title,
    category,
    videoUrl,
    coverUrl,
    script,
    createdAt: new Date().toISOString()
  };

  fs.writeFileSync(filepath, JSON.stringify(result, null, 2));
  console.log(`💾 结果已保存: ${filepath}`);
}

/**
 * 主函数
 */
async function main() {
  // 获取命令行参数
  const args = process.argv.slice(2);
  const scriptFile = args[0];

  if (!scriptFile) {
    console.error('使用方法: node generate-video.js <script-file>');
    console.error('示例: node generate-video.js ./scripts/example-script.json');
    process.exit(1);
  }

  // 读取教案
  let script;
  try {
    script = JSON.parse(fs.readFileSync(scriptFile, 'utf8'));
  } catch (error) {
    console.error('❌ 无法读取教案文件:', error.message);
    process.exit(1);
  }

  console.log(`🎬 开始生产视频: ${script.title}`);
  console.log(`📂 主题类型: ${script.category}`);

  // 检查/启动服务
  const isRunning = await checkJimengService();
  if (!isRunning) {
    const started = await startJimengService();
    if (!started) {
      console.error('❌ 无法启动即梦服务');
      process.exit(1);
    }
  }

  try {
    // 生成视频
    const videoUrl = await generateVideo(script.videoPrompt, script.duration);
    console.log(`🎥 视频: ${videoUrl}`);

    // 生成封面
    const coverUrl = await generateCover(script.coverPrompt);
    console.log(`🖼️ 封面: ${coverUrl}`);

    // 保存结果
    saveResult(script.title, script.category, videoUrl, coverUrl, script);

    // 发送到钉钉
    await sendToDingTalk(
      script.title,
      script.category,
      videoUrl,
      coverUrl,
      script.knowledgePoints
    );

    console.log('✅ 视频生产完成！');
  } catch (error) {
    console.error('❌ 生产失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  checkJimengService,
  startJimengService,
  generateVideo,
  generateCover,
  sendToDingTalk
};
