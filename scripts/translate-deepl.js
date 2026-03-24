const deepl = require('deepl-node');
const fs = require('fs');

const authKey = '6ade4e62-8259-4089-8194-c4fec66c8c65:fx';
const translator = new deepl.DeepLClient(authKey);

// 读取数据
const data = JSON.parse(fs.readFileSync('./src/data/jobs.json', 'utf8'));

async function translateJob(job) {
  const result = { ...job };
  
  // 翻译 jobDescription
  if (job.jobDescription && /[a-zA-Z]/.test(job.jobDescription)) {
    try {
      const translated = await translator.translateText(job.jobDescription, 'en', 'zh');
      result.jobDescription = translated.text;
    } catch (e) {
      console.error('Error translating jobDescription:', e.message);
    }
  }
  
  // 翻译 requirements
  if (job.requirements && /[a-zA-Z]/.test(job.requirements)) {
    try {
      const translated = await translator.translateText(job.requirements, 'en', 'zh');
      result.requirements = translated.text;
    } catch (e) {
      console.error('Error translating requirements:', e.message);
    }
  }
  
  return result;
}

async function main() {
  console.log('开始翻译...');
  
  for (let i = 0; i < data.length; i++) {
    const job = data[i];
    
    // 检查是否需要翻译
    const needTranslateDesc = job.jobDescription && /[a-zA-Z]/.test(job.jobDescription);
    const needTranslateReq = job.requirements && /[a-zA-Z]/.test(job.requirements);
    
    if (needTranslateDesc || needTranslateReq) {
      console.log(`翻译岗位 ${i + 1}/${data.length}: ${job.title?.slice(0, 30)}...`);
      
      const result = await translateJob(job);
      data[i] = result;
      
      // 每翻译10个保存一次
      if ((i + 1) % 10 === 0) {
        fs.writeFileSync('./src/data/jobs.json', JSON.stringify(data, null, 2));
        console.log('已保存进度');
      }
    }
    
    // 避免请求过快
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // 最终保存
  fs.writeFileSync('./src/data/jobs.json', JSON.stringify(data, null, 2));
  console.log('翻译完成！');
}

main().catch(console.error);
