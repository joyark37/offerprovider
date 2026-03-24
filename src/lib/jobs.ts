export interface Job {
  id: string
  title: string
  titleChinese?: string
  company: string
  location: string
  jobType: string
  department: string
  description: string
  publishDate: string
  link: string
  tags: string[]
}

// Fallback jobs data (used when data file is not available)
export const jobs: Job[] = [
  {
    id: '1',
    title: 'Director, Licensing Control',
    company: 'Bitget',
    location: 'Remote/Singapore',
    jobType: '全职',
    department: 'Legal & Compliance',
    description: 'Oversee all post-licensing compliance obligations...',
    publishDate: '2026-03-17',
    link: 'https://hire-r1.mokahr.com/social-recruitment/bitget/100000079#/job/380d318d-4131-4959-b93e-62036cd9260a',
    tags: ['Hot', '全职']
  },
  {
    id: '2',
    title: 'AI Marketing & Ecosystem Lead',
    company: 'Bitget',
    location: 'Remote/Singapore',
    jobType: '全职',
    department: 'Operations',
    description: 'AI Native growth hacker...',
    publishDate: '2026-03-13',
    link: 'https://hire-r1.mokahr.com/social-recruitment/bitget/100000079#/job/76817b96-ef6e-4abd-8f36-a5df40fc9ec9',
    tags: ['Hot', '全职']
  }
]
