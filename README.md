# AI 简历投递助手 🎯

一个帮助收集简历并分析匹配度的工具。

## 快速开始

### 1. 配置飞书机器人

1. 打开飞书，创建一个群聊
2. 点击群设置 -> 添加机器人 -> **自定义机器人**
3. 设置机器人名称（如：简历助手）
4. 复制 Webhook 地址（格式：`https://open.feishu.cn/open-apis/bot/v2/hook/xxx`）
5. 在项目根目录创建 `.env.local` 文件：

```bash
FEISHU_WEBHOOK_URL=你的飞书Webhook地址
```

### 2. 启动服务

```bash
cd ai-resume-helper
npm install
npm run dev
```

访问 http://localhost:3000

### 3. 测试流程

1. 打开网页，选择一个岗位
2. 填写姓名、邮箱，上传简历
3. 点击提交
4. 查看飞书群聊，应该会收到投递通知

## 整体流程图

```
用户访问网页
    ↓
选择岗位 → 填写表单 → 上传简历
    ↓
点击提交
    ↓
后端API接收 → 保存简历到本地
    ↓
发送飞书消息通知（包含岗位信息+简历）
    ↓
你收到通知 → 查看简历 → 人工审核
```

## 文件结构

```
ai-resume-helper/
├── src/
│   ├── app/
│   │   ├── api/submit/route.ts  # 提交API
│   │   ├── page.tsx             # 主页面
│   │   └── layout.tsx           # 布局
│   └── lib/
│       └── jobs.ts              # 岗位数据
├── .env.local.example            # 配置示例
└── README.md
```

## 添加更多岗位

编辑 `src/lib/jobs.ts` 文件，添加更多岗位：

```typescript
{
  id: '6',
  title: '产品经理',
  company: '某公司',
  location: '北京',
  salary: '20k-35k',
  tags: ['产品', 'B端'],
  link: 'https://...',
  description: '岗位描述'
}
```

## 下一步（可选）

- [ ] 添加 AI 分析功能（DeepSeek API）
- [ ] 部署到 Vercel
- [ ] 添加更多数据源（爬虫/API）

---

**成本：0 元**
- 飞书机器人：免费
- 部署：Vercel 免费额度
- 存储：本地（不花钱）
