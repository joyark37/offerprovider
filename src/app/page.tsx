'use client'

import { useState, useEffect, useMemo } from 'react'
import { type Job } from '@/lib/types'

// 岗位类别映射
const JOB_CATEGORIES = [
  { id: 'all', name: '全部' },
  { id: 'product', name: '产品', keywords: ['产品', 'Product', 'PM'] },
  { id: 'frontend', name: '前端', keywords: ['前端', 'Front-end', 'Frontend', 'React', 'Vue', 'Flutter', 'iOS', 'Android', 'Android'] },
  { id: 'backend', name: '后端', keywords: ['后端', 'Back-end', 'Backend', 'Java', 'Go', 'Node', 'Engineer', '开发'] },
  { id: 'design', name: '设计', keywords: ['设计', 'Design', 'UI', 'UX', '视觉', '美术'] },
  { id: 'operation', name: '运营', keywords: ['运营', 'Operation', '客服', 'CS'] },
  { id: 'marketing', name: '市场', keywords: ['市场', 'Marketing', '商务', 'BD', '增长', 'Growth'] },
  { id: 'data', name: '数据', keywords: ['数据', 'Data', '分析', 'Analyst', '风控', 'Risk'] },
  { id: 'legal', name: '合规', keywords: ['合规', 'Compliance', '法务', 'Legal', 'License'] },
  { id: 'finance', name: '财务', keywords: ['财务', 'Finance', '会计', 'Accounting', '税务'] },
  { id: 'hr', name: 'HR', keywords: ['HR', '人力资源', '招聘', 'Recruit'] },
]

// 职级筛选
const JOB_LEVELS = [
  { id: 'all', name: '全部' },
  { id: 'intern', name: '实习', keywords: ['Intern', '实习'] },
  { id: 'junior', name: '初级', keywords: ['Junior', '初级', '专员的'] },
  { id: 'senior', name: '高级', keywords: ['Senior', '高级', '资深'] },
  { id: 'lead', name: '负责人', keywords: ['Lead', 'Manager', '负责人', '主管'] },
  { id: 'head', name: '总监', keywords: ['Head', 'Director', '总监', 'VP'] },
]

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // 筛选状态
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedLevel, setSelectedLevel] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 30
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  })
  const [resumeFile, setResumeFile] = useState<File | null>(null)

  // 滚动到岗位职责部分
  useEffect(() => {
    if (selectedJob) {
      const timer = setTimeout(() => {
        document.getElementById('job-description')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [selectedJob])

  useEffect(() => {
    fetch('/api/jobs')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setJobs(data)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // 筛选逻辑
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      // 搜索匹配
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchTitle = job.title.toLowerCase().includes(query)
        const matchDept = job.department?.toLowerCase().includes(query)
        const matchDesc = job.jobDescription?.toLowerCase().includes(query) || job.requirements?.toLowerCase().includes(query)
        if (!matchTitle && !matchDept && !matchDesc) return false
      }
      
      // 类别筛选
      if (selectedCategory !== 'all') {
        const category = JOB_CATEGORIES.find(c => c.id === selectedCategory)
        if (category && category.keywords) {
          const match = category.keywords.some(kw => 
            job.title.toLowerCase().includes(kw.toLowerCase()) ||
            job.department?.toLowerCase().includes(kw.toLowerCase()) ||
            job.jobDescription?.toLowerCase().includes(kw.toLowerCase())
          )
          if (!match) return false
        }
      }
      
      // 职级筛选
      if (selectedLevel !== 'all') {
        const level = JOB_LEVELS.find(l => l.id === selectedLevel)
        if (level && level.keywords) {
          const match = level.keywords.some(kw => 
            job.title.toLowerCase().includes(kw.toLowerCase())
          )
          if (!match) return false
        }
      }
      
      return true
    })
  }, [jobs, searchQuery, selectedCategory, selectedLevel])

  // 分页
  const totalPages = Math.ceil(filteredJobs.length / ITEMS_PER_PAGE)
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredJobs.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredJobs, currentPage])

  // 重置页码当筛选条件变化时
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory, selectedLevel])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedJob || !resumeFile) return

    // 表单校验
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const phoneRegex = /^[\d\s\-+()]{7,20}$/
    
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      alert('请输入有效的姓名（至少2个字符）')
      return
    }
    
    if (!emailRegex.test(formData.email)) {
      alert('请输入有效的邮箱地址')
      return
    }
    
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      alert('请输入有效的电话号码')
      return
    }
    
    // 文件大小校验 (最大 5MB)
    if (resumeFile.size > 5 * 1024 * 1024) {
      alert('简历文件大小不能超过 5MB')
      return
    }
    
    // 文件类型校验
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(resumeFile.type)) {
      alert('仅支持 PDF、DOC、DOCX 格式的简历')
      return
    }

    setSubmitting(true)
    
    try {
      const reader = new FileReader()
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string
          const base64 = result.split(',')[1]
          resolve(base64)
        }
        reader.onerror = reject
        reader.readAsDataURL(resumeFile)
      })

      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          jobId: selectedJob.id,
          jobTitle: selectedJob.title,
          jobCompany: selectedJob.company,
          jobLink: selectedJob.link,
          resumeBase64: fileBase64,
          resumeName: resumeFile.name,
          resumeType: resumeFile.type
        })
      })

      if (response.ok) {
        setSubmitted(true)
      } else {
        alert('提交失败，请重试')
      }
    } catch (error) {
      console.error(error)
      alert('提交失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">提交成功！</h2>
          <p className="text-gray-600 mb-4">
            感谢您的投递，我们会尽快审核并与您联系。
          </p>
          <button
            onClick={() => {
              setSubmitted(false)
              setSelectedJob(null)
              setFormData({ name: '', email: '', phone: '', notes: '' })
              setResumeFile(null)
            }}
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            投递更多岗位
          </button>
        </div>
      </div>
    )
  }

  if (selectedJob) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => setSelectedJob(null)}
            className="mb-6 text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-2"
          >
            ← 返回岗位列表
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {selectedJob.title}
            </h2>
            {selectedJob.titleChinese && (
              <p className="text-lg text-gray-600 mb-2">{selectedJob.titleChinese}</p>
            )}
            <p className="text-lg text-gray-600 mb-4">
              {selectedJob.company} • {selectedJob.location}
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedJob.department && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  {selectedJob.department}
                </span>
              )}
              {selectedJob.jobType && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  {selectedJob.jobType}
                </span>
              )}
              {selectedJob.publishDate && (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                  {selectedJob.publishDate}
                </span>
              )}
              {selectedJob.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Job Description */}
          {(selectedJob.jobDescription || selectedJob.requirements) && (
            <div id="job-description" className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">📋 岗位职责 & 要求</h3>
              
              {selectedJob.jobDescription && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">What You'll Do</h4>
                  <div className="text-gray-600 whitespace-pre-line text-sm leading-relaxed">
                    {selectedJob.jobDescription}
                  </div>
                </div>
              )}
              
              {selectedJob.requirements && (
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">Requirements</h4>
                  <div className="text-gray-600 whitespace-pre-line text-sm leading-relaxed">
                    {selectedJob.requirements}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* About Us */}
          {selectedJob.aboutUs && (
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">🏢 About Us</h3>
              <div className="text-gray-600 whitespace-pre-line text-sm leading-relaxed">
                {selectedJob.aboutUs}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">📝 提交简历</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                姓名 *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="请输入姓名"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                邮箱 *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="请输入邮箱"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                电话
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="请输入电话"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                简历文件 *
              </label>
              <input
                type="file"
                required
                accept=".pdf,.doc,.docx"
                onChange={e => setResumeFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">支持 PDF、DOC、DOCX 格式</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                备注
              </label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                rows={3}
                placeholder="想说的话或补充信息"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
            >
              {submitting ? '提交中...' : '提交申请'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🎯 热门岗位投递
          </h1>
          <p className="text-gray-600">
            选择你感兴趣的岗位，一键投递简历
          </p>
        </header>

        {/* 搜索和筛选区域 */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          {/* 搜索框 */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="🔍 搜索岗位名称、部门、技能..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          
          {/* 筛选器 */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* 岗位类别 */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">岗位类别</label>
              <div className="flex flex-wrap gap-2">
                {JOB_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            {/* 职级 */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">职级</label>
              <div className="flex flex-wrap gap-2">
                {JOB_LEVELS.map(level => (
                  <button
                    key={level.id}
                    onClick={() => setSelectedLevel(level.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedLevel === level.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {level.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">加载中...</p>
          </div>
        ) : paginatedJobs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <p className="text-gray-500 mb-4">没有找到匹配的岗位</p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('all')
                setSelectedLevel('all')
              }}
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              清除筛选条件
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {paginatedJobs.map(job => (
              <div
                key={job.id}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedJob(job)}
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">
                      {job.title}
                    </h3>
                    <p className="text-gray-600 mb-2">
                      {job.company} • {job.location}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {job.department && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {job.department}
                        </span>
                      )}
                      {job.jobType && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                          {job.jobType}
                        </span>
                      )}
                      {job.publishDate && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
                          {job.publishDate}
                        </span>
                      )}
                      {job.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button className="mt-4 md:mt-0 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors">
                    投递
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              上一页
            </button>
            <span className="px-4 py-2 text-gray-600">
              第 {currentPage} / {totalPages} 页
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              下一页
            </button>
          </div>
        )}

        <footer className="mt-8 text-center text-gray-500 text-sm">
          <p>
            💡 共 {jobs.length} 个岗位 
            {(searchQuery || selectedCategory !== 'all' || selectedLevel !== 'all') && (
              <span className="ml-2">| 筛选后 {filteredJobs.length} 个</span>
            )}
          </p>
        </footer>
      </div>
    </div>
  )
}
