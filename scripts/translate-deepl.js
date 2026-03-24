const deepl = require('deepl-node');
const fs = require('fs');

const authKey = '6ade4e62-8259-4089-8194-c4fec66c8c65:fx';
const translator = new deepl.DeepLClient(authKey);

// 读取数据
const data = JSON.parse(fs.readFileSync('./src/data/jobs.json', 'utf8'));

async function translateText(text) {
  if (!text || !/[a-zA-Z]/.test(text)) return text;
  
  try {
    const result = await translator.translateText(text, { targetLang: 'ZH' });
    return result.text;
  } catch (e) {
    console.error('Error:', e.message);
    return text;
  }
}

async function translateJob(job) {
  const result = { ...job };
  
  // 翻译 jobDescription
  if (job.jobDescription && /[a-zA-Z]/.test(job.jobDescription)) {
    result.jobDescription = await translateText(job.jobDescription);
  }
  
  // 翻译 requirements
  if (job.requirements && /[a-zA-Z]/.test(job.requirements)) {
    result.requirements = await translateText(job.requirements);
  }
  
  return result;
}

async function main() {
  console.log('开始翻译...');
  
  for (let i = 0; i < data.length; i++) {
    const job = data[i];
    
    const needTranslate = (job.jobDescription && /[a-zA-Z]/.test(job.jobDescription)) || 
                         (job.requirements && /[a-zA-Z]/.test(job.requirements));
    
    if (needTranslate) {
      console.log(`翻译 ${i + 1}/${data.length}: ${job.title?.slice(0, 40)}`);
      data[i] = await translateJob(job);
      
      // 每5个保存一次
      if ((i + 1) % 5 === 0) {
        fs.writeFileSync('./src/data/jobs.json', JSON.stringify(data, null, 2));
        console.log('已保存');
      }
    }
    
    // 延迟避免过快
    await new Promise(r => setTimeout(r, 200));
  }
  
  fs.writeFileSync('./src/data/jobs.json', JSON.stringify(data, null, 2));
  console.log('完成！');
}

main().catch(console.error);
