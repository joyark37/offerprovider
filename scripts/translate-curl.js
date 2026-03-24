const fs = require('fs');
const { execSync } = require('child_process');

const authKey = '6ade4e62-8259-4089-8194-c4fec66c8c65:fx';

function translate(text) {
  if (!text || !/[a-zA-Z]/.test(text)) return text;
  
  // 分块翻译（避免太长）
  const chunks = text.match(/.{1,1000}/g) || [];
  let result = [];
  
  for (const chunk of chunks) {
    const escaped = chunk.replace(/"/g, '\\"').replace(/\n/g, '\\n');
    const cmd = `curl -s -X POST "https://api-free.deepl.com/v2/translate" \
      -H "Authorization: DeepL-Auth-Key ${authKey}" \
      -d "text=${escaped}" \
      -d "target_lang=ZH"`;
    
    try {
      const output = execSync(cmd, { encoding: 'utf8' });
      const json = JSON.parse(output);
      if (json.translations && json.translations[0]) {
        result.push(json.translations[0].text);
      }
    } catch (e) {
      console.error('Error:', e.message);
      result.push(chunk);
    }
  }
  
  return result.join('');
}

// 读取数据
const data = JSON.parse(fs.readFileSync('./src/data/jobs.json', 'utf8'));

console.log('开始翻译...');

for (let i = 0; i < data.length; i++) {
  const job = data[i];
  
  const needTranslate = (job.jobDescription && /[a-zA-Z]/.test(job.jobDescription)) || 
                       (job.requirements && /[a-zA-Z]/.test(job.requirements));
  
  if (needTranslate) {
    console.log(`翻译 ${i + 1}/${data.length}: ${job.title?.slice(0, 40)}`);
    
    if (job.jobDescription && /[a-zA-Z]/.test(job.jobDescription)) {
      job.jobDescription = translate(job.jobDescription);
    }
    if (job.requirements && /[a-zA-Z]/.test(job.requirements)) {
      job.requirements = translate(job.requirements);
    }
    
    if ((i + 1) % 5 === 0) {
      fs.writeFileSync('./src/data/jobs.json', JSON.stringify(data, null, 2));
      console.log('已保存');
    }
  }
}

fs.writeFileSync('./src/data/jobs.json', JSON.stringify(data, null, 2));
console.log('完成！');
