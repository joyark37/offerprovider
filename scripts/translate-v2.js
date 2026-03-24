const fs = require('fs');
const { execSync } = require('child_process');

const authKey = '6ade4e62-8259-4089-8194-c4fec66c8c65:fx';

function translate(text) {
  if (!text || !/[a-zA-Z]/.test(text)) return null;
  
  const escaped = text.replace(/"/g, '\\"').replace(/\n/g, '\\n').slice(0, 3000);
  
  const cmd = `curl -s -X POST "https://api-free.deepl.com/v2/translate" \
    -H "Authorization: DeepL-Auth-Key ${authKey}" \
    -d "text=${escaped}" \
    -d "target_lang=ZH"`;
  
  try {
    const output = execSync(cmd, { encoding: 'utf8', timeout: 10000 });
    const json = JSON.parse(output);
    if (json.translations && json.translations[0]) {
      return json.translations[0].text;
    }
  } catch (e) {
    console.error('Error:', e.message.slice(0, 100));
  }
  return null;
}

function splitJobDescription(text) {
  if (!text) return { whatYoullDo: null, requirements: null };
  
  const lines = text.split('\n');
  let whatYoullDo = [];
  let requirements = [];
  let currentSection = 'other';
  
  for (const line of lines) {
    const lower = line.toLowerCase();
    
    if (lower.includes("what you'll do") || lower.includes('responsibilities') || 
        lower.includes('job description') || lower.includes('岗位职责')) {
      currentSection = 'what';
      continue;
    }
    if (lower.includes('requirements') || lower.includes('qualifications') || 
        lower.includes('任职要求') || lower.includes('岗位要求')) {
      currentSection = 'req';
      continue;
    }
    
    if (currentSection === 'what') {
      whatYoullDo.push(line);
    } else if (currentSection === 'req') {
      requirements.push(line);
    }
  }
  
  if (whatYoullDo.length === 0 && requirements.length === 0) {
    return { whatYoullDo: text, requirements: null };
  }
  
  return {
    whatYoullDo: whatYoullDo.length > 0 ? whatYoullDo.join('\n') : null,
    requirements: requirements.length > 0 ? requirements.join('\n') : null
  };
}

async function main() {
  const data = JSON.parse(fs.readFileSync('./src/data/jobs.json', 'utf8'));
  
  console.log('开始翻译...');
  
  for (let i = 0; i < data.length; i++) {
    const job = data[i];
    
    console.log(`处理 ${i + 1}/${data.length}: ${job.title?.slice(0, 40)}`);
    
    const parts = splitJobDescription(job.jobDescription);
    
    if (parts.whatYoullDo && /[a-zA-Z]/.test(parts.whatYoullDo)) {
      const translated = translate(parts.whatYoullDo);
      if (translated) {
        job.translatedWhatYoullDo = translated;
        console.log('  - What You\'ll Do ✓');
      }
    }
    
    if (parts.requirements && /[a-zA-Z]/.test(parts.requirements)) {
      const translated = translate(parts.requirements);
      if (translated) {
        job.translatedRequirements = translated;
        console.log('  - Requirements ✓');
      }
    }
    
    if ((i + 1) % 5 === 0) {
      fs.writeFileSync('./src/data/jobs.json', JSON.stringify(data, null, 2));
      console.log('已保存\n');
    }
    
    await new Promise(r => setTimeout(r, 300));
  }
  
  fs.writeFileSync('./src/data/jobs.json', JSON.stringify(data, null, 2));
  console.log('\n完成！');
}

main().catch(console.error);
