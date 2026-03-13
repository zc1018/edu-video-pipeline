# 教育短视频自动化生产流水线

> **为30-50岁零基础/低起点学英语人群自动化生产教育短视频**

## 🎯 功能介绍

本系统是一个完整的AI驱动教育短视频生产流水线，能够：

1. **自动生成教案** - 针对零基础人群设计20-30秒知识点
2. **生成视频提示词** - 调用 seedance skill 生成专业的 Seedance 2.0 视频提示词
3. **AI视频生成** - 使用即梦AI生成温馨暖色调教育视频
4. **封面图生成** - 生成生活化封面 + 醒目中文标题
5. **自动推送** - 通过Webhook发送结果到钉钉

## 📁 项目结构

```
edu-video-pipeline/
├── SKILL.md                 # 主技能文档
├── README.md               # 使用说明
├── config.json             # 配置文件
├── scripts/                # 脚本目录
│   ├── generate-video.js   # 单个视频生成脚本
│   ├── batch-generate.js   # 批量生成脚本
│   └── daily-scheduler.js  # 每日定时调度器
├── templates/              # 模板目录
│   ├── lesson-template.md  # 教案模板
│   └── prompt-templates.md # 提示词模板
└── examples/               # 示例目录
    └── example-output.md   # 输出示例
```

## 🚀 快速开始

### 1. 配置钉钉Webhook（可选）

编辑 `config.json`，配置钉钉机器人：

```json
{
  "dingtalk": {
    "webhook_url": "https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN"
  }
}
```

### 2. 立即生成一个视频

```bash
# 使用 Claude 调用 Skill
教育短视频：如何用英语点餐
```

### 3. 批量生成今日4个视频

```bash
# 进入脚本目录
cd ~/.claude/skills/edu-video-pipeline/scripts

# 立即执行批量生产
node batch-generate.js
```

### 4. 设置每日定时生产

```bash
# 启动定时调度器（每天09:00自动生产）
node daily-scheduler.js

# 或使用 pm2 后台运行
pm2 start daily-scheduler.js --name edu-video-scheduler
```

## 📋 使用方式

### 方式1：通过 Claude 调用 Skill

```
# 单次生成
生成一个旅游口语视频：机场值机用语

# 批量生成
批量生产今日4个教育短视频

# 指定主题
生成职场口语视频：如何用地道英语表达"我不太确定"
```

### 方式2：直接运行脚本

```bash
# 单个视频（需要先创建教案JSON文件）
node scripts/generate-video.js ./scripts/教案文件.json

# 批量生成4个视频
node scripts/batch-generate.js

# 定时调度（每天自动）
node scripts/daily-scheduler.js
```

## 🎨 内容主题

系统支持6大主题类型：

| 主题 | 说明 | 频率 |
|-----|------|------|
| 生活口语 | 餐厅点餐、购物、问路 | 每周2次 |
| 旅游口语 | 机场、酒店、景点 | 每周2次 |
| 职场口语 | 会议、邮件、商务 | 每周1次 |
| 英语习语 | Break a leg等 | 每周1次 |
| 节日文化 | 圣诞节、感恩节 | 每周1次 |
| 语法知识 | 时态、介词、句型 | 每周1次 |

## ⚙️ 配置说明

### 视频设置 (video_settings)

```json
{
  "duration_seconds": 30,      // 视频时长
  "aspect_ratio": "16:9",      // 比例
  "style": "温馨暖色调",        // 风格
  "model_description": {       // 模特描述
    "ethnicity": "欧美",
    "age": "20-28岁",
    "gender": "女性"
  }
}
```

### 封面设置 (cover_settings)

```json
{
  "aspect_ratio": "9:16",      // 竖屏比例
  "title_position": "底部",     // 标题位置
  "color_scheme": "暖色调",     // 配色方案
  "font_style": "粗体中文"      // 字体风格
}
```

### 生产计划 (production_schedule)

```json
{
  "daily_count": 4,            // 每日生产数量
  "schedule_time": "09:00",    // 生产时间
  "auto_push": true            // 自动推送钉钉
}
```

## 💡 提示词设计原则

### 视频提示词关键要素

1. **人物一致性**
   - 欧美年轻女性，20-28岁
   - 金发或棕发，亲切微笑
   - 米色/浅蓝色休闲服装

2. **场景要求**
   - 生活化场景（咖啡厅、客厅、书房）
   - 暖色调灯光（米白、浅黄、暖橙）
   - 避免冷冰冰的商务办公室

3. **镜头设计**
   - 0-5秒：中景开场
   - 5-10秒：近景讲解
   - 10-15秒：特写展示
   - 15-20秒：中景演示
   - 20-30秒：全景总结

### 封面图设计原则

1. **构图**
   - 人物占画面上半部分
   - 底部1/3留白放标题
   - 9:16竖屏比例

2. **标题设计**
   - 粗体中文，高对比度
   - 重点词汇用亮色突出
   - 副标题："20秒学会"等

## 🔗 依赖服务

### 即梦 AI 服务

- **本地地址**: `http://localhost:8000`
- **项目路径**: `/Users/xdf/jimeng-free-api-all`
- **启动命令**:
  ```bash
  cd /Users/xdf/jimeng-free-api-all
  npm start
  ```

### Seedance Skill（必需）

- **来源**: https://github.com/songguoxs/seedance-prompt-skill
- **用途**: 生成专业的 Seedance 2.0 视频提示词
- **位置**: `~/.claude/skills/seedance/SKILL.md`
- **说明**: edu-video-pipeline 会调用 seedance skill 生成高质量的视频生成提示词

### 钉钉 Webhook（可选）

- 用于自动推送生产结果
- 在 config.json 中配置 webhook_url

## ⚠️ 注意事项

### 平台限制（重要）

| 限制项 | 即梦 API | 说明 |
|-------|---------|------|
| **视频时长** | 仅支持 5秒 或 10秒 | 不支持15秒，提示词需明确指定时长 |
| **声音** | 无内置人声 | 视频无声，需后期配音或使用字幕 |
| **人物限制** | 不支持真实人脸参考 | 系统会自动拦截含真人脸部的素材 |

### 积分与链接

1. **积分管理**
   - 即梦每日赠送66积分
   - 生成前检查剩余积分
   - 视频生成消耗15-25积分/个
   - 图片生成消耗6-12积分/个

2. **链接有效期**
   - 生成的链接有有效期
   - 请及时下载保存
   - 建议开启自动备份

3. **服务状态**
   - 脚本会自动检测服务状态
   - 如未启动会自动启动
   - 首次使用可能需要等待服务启动

## 📞 故障排除

### 服务启动失败

```bash
# 检查端口占用
lsof -i :8000

# 手动启动服务
cd /Users/xdf/jimeng-free-api-all
npm install
npm run build
npm start
```

### Token 失效

1. 访问 https://jimeng.jianying.com/ 登录
2. F12 → Application → Cookies → 复制 `sessionid`
3. 更新 config.json 中的 token

### 积分不足

- 减少每日生产数量（修改 daily_count）
- 等待次日刷新
- 使用多账号轮询（高级）

## 📝 更新日志

### v1.0.0 (2026-03-12)
- ✅ 初始版本发布
- ✅ 支持教案自动生成
- ✅ 支持即梦AI视频生成
- ✅ 支持封面图生成
- ✅ 支持钉钉推送
- ✅ 支持批量生产和定时调度

## 🤝 贡献指南

欢迎提交 Issue 和 PR！

## 📄 许可证

MIT License

---

**让英语学习变得温暖而简单！** 🌟📚
