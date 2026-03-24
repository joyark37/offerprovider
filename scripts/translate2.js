const fs = require('fs');

// 检查是否主要是中文
function isChinese(text) {
  if (!text) return false;
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const totalChars = text.replace(/[\s\d]/g, '').length;
  return chineseChars / totalChars > 0.3;
}

// 简单翻译函数 - 保持已翻译的中文岗位不变
function translateSimple(text) {
  if (!text || isChinese(text)) return text;
  
  // 只翻译一些关键术语
  const terms = {
    'Oversee': '负责',
    'Manage': '管理',
    'Lead': '负责',
    'Support': '支持',
    'Develop': '开发',
    'Design': '设计',
    'Implement': '实施',
    'Analyze': '分析',
    'Monitor': '监控',
    'Review': '审核',
    'Create': '创建',
    'Build': '构建',
    'Ensure': '确保',
    'Provide': '提供',
    'Senior': '高级',
    'Junior': '初级',
    'Manager': '经理',
    'Director': '总监',
    'Lead': '负责人',
    'Product': '产品',
    'Engineering': '工程',
    'Design': '设计',
    'Marketing': '市场',
    'Operations': '运营',
    'Finance': '财务',
    'Legal': '法务',
    'Compliance': '合规',
    'HR': '人力资源',
    'Experience': '经验',
    'Skills': '技能',
    'Strong': '强',
    'Excellent': '优秀',
    'Required': '必需',
    'Preferred': '优先',
    'Fluent in': '流利使用',
    'Bachelor': '本科',
    'Master': '硕士',
    'Degree': '学位',
    'Crypto': '加密货币',
    'Blockchain': '区块链',
    'Fintech': '金融科技',
    'Trading': '交易',
    'Exchange': '交易所',
    'AI': '人工智能',
    'ML': '机器学习',
    'Python': 'Python',
    'Java': 'Java',
    'JavaScript': 'JavaScript',
    'SQL': 'SQL',
    'API': 'API',
    'Full-time': '全职',
    'Remote': '远程',
    'Benefits': '福利',
    'Salary': '薪资',
    'years': '年',
    'year': '年',
  };
  
  let result = text;
  Object.entries(terms).forEach(([en, zh]) => {
    const regex = new RegExp(en, 'gi');
    result = result.replace(regex, zh);
  });
  
  return result;
}

// 读取数据
const data = JSON.parse(fs.readFileSync('./src/data/jobs.json', 'utf8'));

console.log('开始处理...');

let chinese = 0, translated = 0;
data.forEach((job, index) => {
  let changed = false;
  
  // 检查是否已经是中文岗位描述
  if (job.jobDescription && isChinese(job.jobDescription)) {
    chinese++;
  } else if (job.jobDescription) {
    job.jobDescription = translateSimple(job.jobDescription);
    changed = true;
  }
  
  if (job.requirements && isChinese(job.requirements)) {
    chinese++;
  } else if (job.requirements) {
    job.requirements = translateSimple(job.requirements);
    changed = true;
  }
  
  if (changed) translated++;
  
  if ((index + 1) % 20 === 0) {
    console.log(`已完成 ${index + 1}/${data.length}`);
  }
});

fs.writeFileSync('./src/data/jobs.json', JSON.stringify(data, null, 2));
console.log(`处理完成！${chinese}个已是中文，${translated}个已翻译`);
