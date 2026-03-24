import puppeteer, { type Browser, type Page } from 'puppeteer-core'

interface Job {
  id: string
  title: string
  company: string
  location: string
  jobType: string
  department: string
  aboutUs: string
  jobDescription: string
  requirements: string
  publishDate: string
  link: string
  tags: string[]
}

async function getChromePath(): Promise<string> {
  return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
}

async function scrapeAllJobDetails(): Promise<Job[]> {
  const chromePath = await getChromePath()
  
  const browser: Browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
    defaultViewport: { width: 1400, height: 900 }
  })
  
  const page = await browser.newPage()
  const allJobs: Job[] = []
  
  try {
    const baseUrl = 'https://hire-r1.mokahr.com/social-recruitment/bitget/100000079'
    
    // Get all job links from all 5 pages
    const allJobLinks: string[] = []
    
    for (let pageNum = 1; pageNum <= 5; pageNum++) {
      console.log(`=== Getting job links from page ${pageNum}/5 ===`)
      
      const url = `${baseUrl}#/jobs?page=${pageNum}&pageSize=50`
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 })
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      const jobLinks = await page.evaluate(() => {
        const links: string[] = []
        const elements = document.querySelectorAll('a[href*="#/job/"]')
        elements.forEach(el => {
          const href = el.getAttribute('href')
          if (href && href.includes('#/job/')) {
            links.push(href)
          }
        })
        return [...new Set(links)]
      })
      
      allJobLinks.push(...jobLinks)
      console.log(`Found ${jobLinks.length} links, total: ${allJobLinks.length}`)
    }
    
    console.log(`\n=== Visiting ${allJobLinks.length} job pages ===\n`)
    
    // Visit each job detail page
    for (let i = 0; i < allJobLinks.length; i++) {
      try {
        const jobPath = allJobLinks[i].split('#')[1]
        const jobId = jobPath.split('/job/')[1]?.split('?')[0]
        
        if (!jobId) continue
        
        console.log(`[${i+1}/${allJobLinks.length}] Scraping job: ${jobId}`)
        
        await page.goto(`${baseUrl}#${jobPath}`, { waitUntil: 'networkidle0', timeout: 30000 })
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        // Extract full job details - 更宽松的解析
        const jobDetail = await page.evaluate(() => {
          // 尝试多种方式找 title
          let title = ''
          
          // 方法1: h1
          const h1 = document.querySelector('h1')
          if (h1 && h1.textContent && h1.textContent.length < 100) {
            title = h1.textContent.trim()
          }
          
          // 方法2: main title
          if (!title) {
            const mainTitle = document.querySelector('[class*="title"]') || document.querySelector('[class*="Title"]')
            if (mainTitle && mainTitle.textContent) {
              title = mainTitle.textContent.trim()
            }
          }
          
          // 方法3: 从 URL 提取备用
          
          // Get all text content from the page
          const bodyText = document.body.innerText
          
          // Try to extract sections
          const sections: Record<string, string> = {}
          
          // Split by common headers - 更多匹配
          const headers = [
            'About us', 'What you\'ll do', 'What you\'ll need', 'Requirements', 
            'Benefits', 'Role Overview', '岗位职责', '任职要求', '加分项',
            '工作职责', '岗位要求', '职位描述', '岗位描述'
          ]
          
          let currentSection = 'intro'
          let content = ''
          
          const lines = bodyText.split('\n').filter(function(l) { return l.trim() })
          
          for (const line of lines) {
            let foundHeader = false
            for (const header of headers) {
              if (line.includes(header) && line.length < 50) {
                sections[currentSection] = content.trim()
                currentSection = header
                content = ''
                foundHeader = true
                break
              }
            }
            if (!foundHeader) {
              content += line + '\n'
            }
          }
          sections[currentSection] = content.trim()
          
          return {
            title,
            bodyText,
            sections,
            rawHtml: document.body.innerHTML.substring(0, 2000) // 调试用
          }
        })
        
        // 更宽松的判断条件
        if (jobDetail.bodyText && jobDetail.bodyText.length > 100) {
          const text = jobDetail.bodyText
          
          // 如果 title 还是没有，用第一行
          let title = jobDetail.title
          if (!title || title.length < 5) {
            const lines = text.split('\n').filter(l => l.trim())
            if (lines.length > 0) {
              title = lines[0].substring(0, 80)
            }
          }
          
          // Extract department
          const deptMatch = text.match(/\|([A-Za-z\s&]+)\|/)
          const department = deptMatch ? deptMatch[1].trim() : 'Operations'
          
          // Extract date
          const dateMatch = text.match(/Posted on (\d{4}-\d{2}-\d{2})/i) || text.match(/发布于 (\d{4}-\d{2}-\d{2})/i)
          const publishDate = dateMatch ? dateMatch[1] : ''
          
          // Job type
          const jobType = text.includes('全职') || text.includes('Full-time') ? '全职' : 
                         text.includes('实习') || text.includes('Internship') ? '实习' : '全职'
          
          // Tags
          const tags: string[] = []
          if (text.includes('Hot')) tags.push('Hot')
          
          // Extract sections - 合并所有内容作为后备
          let aboutUs = jobDetail.sections['About us'] || jobDetail.sections['关于我们'] || ''
          let jobDescription = jobDetail.sections['What you\'ll do'] || jobDetail.sections['岗位职责'] || jobDetail.sections['Role Overview'] || jobDetail.sections['工作职责'] || ''
          let requirements = jobDetail.sections['What you\'ll need'] || jobDetail.sections['任职要求'] || jobDetail.sections['Requirements'] || jobDetail.sections['岗位要求'] || ''
          
          // 如果 sections 都是空的，就把整个 bodyText 分一部分
          if (!jobDescription && text.length > 200) {
            const parts = text.split(/(?=岗位职责|工作职责|职位描述)/)
            if (parts.length > 1) {
              jobDescription = parts.slice(1).join('\n').substring(0, 2000)
            }
          }
          
          const link = `${baseUrl}#/job/${jobId}`
          
          // Clean title
          const cleanTitle = (title || 'Unknown').replace(/^Hot\s*/, '').trim()
          
          allJobs.push({
            id: jobId,
            title: cleanTitle,
            company: 'Bitget',
            location: 'Remote/Singapore',
            jobType,
            department,
            aboutUs: aboutUs.slice(0, 1000),
            jobDescription: jobDescription.slice(0, 2000),
            requirements: requirements.slice(0, 1500),
            publishDate,
            link,
            tags
          })
          
          console.log(`  ✓ ${cleanTitle.slice(0, 40)}`)
        } else {
          console.log(`  ✗ No content for job ${jobId}`)
        }
        
      } catch (e) {
        console.log(`  ✗ Error: ${e}`)
      }
    }
    
    // Remove duplicates
    const uniqueJobs = allJobs.filter((job, index, self) => 
      index === self.findIndex(j => j.id === job.id)
    )
    
    console.log(`\n=== Total: ${uniqueJobs.length} jobs ===`)
    
    return uniqueJobs
    
  } catch (error) {
    console.error('Error:', error)
    return allJobs
  }
}

// Run
scrapeAllJobDetails()
  .then(jobs => {
    const fs = require('fs')
    const path = require('path')
    const outputPath = path.join(__dirname, '../src/data/bitget-jobs.json')
    
    const dir = path.dirname(outputPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(jobs, null, 2))
    console.log(`Saved ${jobs.length} jobs to ${outputPath}`)
  })
  .catch(console.error)