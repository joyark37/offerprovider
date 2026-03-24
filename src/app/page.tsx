'use client'

import { useState, useEffect } from 'react'
import { type Job } from '@/lib/types'

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  })
  const [resumeFile, setResumeFile] = useState<File | null>(null)

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
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
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
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🎯 热门岗位投递
          </h1>
          <p className="text-gray-600">
            选择你感兴趣的岗位，一键投递简历
          </p>
        </header>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">加载中...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {jobs.map(job => (
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

        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>💡 共 {jobs.length} 个岗位</p>
        </footer>
      </div>
    </div>
  )
}
