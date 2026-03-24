const fs = require('fs');

// 更精准的翻译词典 - 按优先级排序
const translations = [
  // 完整短语优先
  ['Bachelor\'s degree', '本科学历'],
  ['Master\'s degree', '硕士学历'],
  ['PhD degree', '博士学位'],
  ['Proven track record', '良好业绩记录'],
  ['Track record', '业绩记录'],
  ['Strong communication skills', '沟通能力强'],
  ['Excellent communication', '优秀沟通能力'],
  ['Problem-solving skills', '解决问题的能力'],
  ['Analytical skills', '分析能力'],
  ['Leadership skills', '领导力'],
  ['Teamwork skills', '团队合作能力'],
  ['Project management', '项目管理'],
  ['Data analysis', '数据分析'],
  ['Machine Learning', '机器学习'],
  ['Full-time', '全职'],
  ['Part-time', '兼职'],
  ['Remote work', '远程工作'],
  ['Competitive salary', '有竞争力的薪资'],
  ['Health insurance', '医疗保险'],
  ['Annual leave', '年假'],
  ['Flexible hours', '弹性工作时间'],
  ['Work experience', '工作经验'],
  ['Years of experience', '年工作经验'],
  ['Senior level', '高级别'],
  ['Junior level', '初级别'],
  ['Nice to have', '优先考虑'],
  ['Must have', '必备'],
  ['Plus', '加分'],
  ['Preferred', '优先'],
  ['Required', '必需'],
  ['Fluent in English', '英语流利'],
  ['Fluent in Chinese', '中文流利'],
  ['Native English speaker', '英语母语'],
  ['Native Chinese speaker', '中文母语'],
  ['Written and spoken', '书面和口语'],
  ['Business level', '商务级别'],
  ['Cross-functional', '跨部门'],
  ['Stakeholder management', '相关方管理'],
  ['Risk management', '风险管理'],
  ['Content creation', '内容创作'],
  ['Social media', '社交媒体'],
  ['Digital marketing', '数字营销'],
  ['Growth hacking', '增长黑客'],
  ['User experience', '用户体验'],
  ['User research', '用户研究'],
  ['Product management', '产品管理'],
  ['Business development', '业务拓展'],
  ['Key account', '关键客户'],
  ['Event planning', '活动策划'],
  ['Community management', '社区管理'],
  ['Customer service', '客户服务'],
  ['Technical support', '技术支持'],
  ['Quality assurance', '质量保证'],
  ['Human resources', '人力资源'],
  ['Legal compliance', '法律合规'],
  ['Financial analysis', '财务分析'],
  
  // 单词
  ['Oversee', '负责监管'],
  ['Overseeing', '负责监管'],
  ['Manage', '管理'],
  ['Managing', '管理'],
  ['Lead', '负责'],
  ['Leading', '负责'],
  ['Support', '支持'],
  ['Supporting', '支持'],
  ['Coordinate', '协调'],
  ['Coordinating', '协调'],
  ['Develop', '开发/制定'],
  ['Developing', '开发/制定'],
  ['Design', '设计'],
  ['Designing', '设计'],
  ['Implement', '实施'],
  ['Implementing', '实施'],
  ['Maintain', '维护'],
  ['Analyze', '分析'],
  ['Analyzing', '分析'],
  ['Monitor', '监控'],
  ['Monitoring', '监控'],
  ['Review', '审核'],
  ['Reviewing', '审核'],
  ['Create', '创建'],
  ['Build', '构建'],
  ['Building', '构建'],
  ['Ensure', '确保'],
  ['Providing', '提供'],
  ['Contribute', '贡献'],
  
  // 形容词
  ['Strong', '强'],
  ['Excellent', '优秀'],
  ['Outstanding', '出色'],
  ['Proficient', '熟练'],
  ['Experienced', '有经验的'],
  ['Skilled', '熟练的'],
  
  // 学位
  ['Bachelor', '本科'],
  ['Master', '硕士'],
  ['PhD', '博士'],
  
  // 职位级别
  ['Senior', '高级'],
  ['Junior', '初级'],
  ['Manager', '经理'],
  ['Director', '总监'],
  ['Head', '负责人'],
  ['VP', '副总裁'],
  ['Executive', '高管'],
  ['Intern', '实习'],
  ['Associate', '专员'],
  ['Specialist', '专员'],
  ['Coordinator', '协调员'],
  
  // 部门
  ['Product', '产品'],
  ['Engineering', '工程'],
  ['Design', '设计'],
  ['Marketing', '市场'],
  ['Sales', '销售'],
  ['Operations', '运营'],
  ['Finance', '财务'],
  ['Legal', '法务'],
  ['HR', '人力资源'],
  ['Compliance', '合规'],
  ['Customer Service', '客服'],
  ['Technology', '技术'],
  ['Business', '业务'],
  
  // 技能/工具
  ['Java', 'Java'],
  ['Python', 'Python'],
  ['Go', 'Go'],
  ['Golang', 'Go'],
  ['JavaScript', 'JavaScript'],
  ['TypeScript', 'TypeScript'],
  ['React', 'React'],
  ['Vue', 'Vue'],
  ['Node', 'Node.js'],
  ['SQL', 'SQL'],
  ['API', 'API'],
  ['AI', '人工智能'],
  ['ML', '机器学习'],
  ['PM', '产品经理'],
  
  // 行业
  ['Crypto', '加密货币'],
  ['Cryptocurrency', '加密货币'],
  ['Blockchain', '区块链'],
  ['Fintech', '金融科技'],
  ['Exchange', '交易所'],
  ['Trading', '交易'],
  ['DeFi', '去中心化金融'],
  ['Web3', 'Web3'],
  
  // 语言
  ['Fluent', '流利'],
  ['Native', '母语'],
  
  // 常用词
  ['Strategy', '策略'],
  ['Strategic', '战略'],
  ['Process', '流程'],
  ['Platform', '平台'],
  ['System', '系统'],
  ['Tools', '工具'],
  ['Solutions', '解决方案'],
  ['Requirements', '需求'],
  ['Features', '功能'],
  ['Users', '用户'],
  ['Customers', '客户'],
  ['Partners', '合作伙伴'],
  ['Teams', '团队'],
  ['Stakeholders', '利益相关方'],
  ['Metrics', '指标'],
  ['KPIs', '关键绩效指标'],
  ['Performance', '性能/绩效'],
  ['Revenue', '收入'],
  ['Growth', '增长'],
  ['Engagement', '参与度'],
  ['Conversion', '转化'],
  ['Retention', '留存'],
  ['Acquisition', '获客'],
  
  // 时间
  ['Years', '年'],
  ['Months', '月'],
  ['Daily', '每日'],
  ['Weekly', '每周'],
  ['Monthly', '每月'],
  ['Quarterly', '每季度'],
  ['Annually', '每年'],
  
  // 动作
  ['Drive', '推动'],
  ['Deliver', '交付'],
  ['Execute', '执行'],
  ['Optimize', '优化'],
  ['Improve', '改进'],
  ['Enhance', '增强'],
  ['Increase', '增加'],
  ['Reduce', '减少'],
  ['Minimize', '最小化'],
  ['Maximize', '最大化'],
  
  // 能力
  ['Ability', '能力'],
  ['Capability', '能力'],
  ['Skills', '技能'],
  ['Expertise', '专业知识'],
  ['Knowledge', '知识'],
  ['Experience', '经验'],
];

function translateToChinese(text) {
  if (!text) return text;
  
  let translated = text;
  
  // 按长度排序，先替换长的
  translations.forEach(([en, zh]) => {
    const regex = new RegExp(en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    translated = translated.replace(regex, zh);
  });
  
  // 清理
  translated = translated.replace(/(\d+)\s*\+\s*years?/gi, '$1+年');
  translated = translated.replace(/(\d+)\s*years?/gi, '$1年');
  translated = translated.replace(/(\d+)\s*months?/gi, '$1个月');
  translated = translated.replace(/English and Mandarin/gi, '英语和普通话');
  translated = translated.replace(/English or Chinese/gi, '英语或中文');
  translated = translated.replace(/Chinese and English/gi, '中文和英文');
  
  return translated;
}

// 读取数据
const data = JSON.parse(fs.readFileSync('./src/data/jobs.json', 'utf8'));

console.log('开始翻译...');

data.forEach((job, index) => {
  if (job.jobDescription) {
    job.jobDescription = translateToChinese(job.jobDescription);
  }
  if (job.requirements) {
    job.requirements = translateToChinese(job.requirements);
  }
  if (job.aboutUs) {
    job.aboutUs = translateToChinese(job.aboutUs);
  }
  if ((index + 1) % 20 === 0) {
    console.log(`已完成 ${index + 1}/${data.length}`);
  }
});

fs.writeFileSync('./src/data/jobs.json', JSON.stringify(data, null, 2));
console.log(`翻译完成！共处理 ${data.length} 个岗位`);
