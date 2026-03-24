export interface Job {
  id: string
  title: string
  titleChinese?: string
  company: string
  location: string
  jobType: string
  department: string
  aboutUs: string
  jobDescription: string
  requirements: string
  translatedWhatYoullDo?: string
  translatedRequirements?: string
  publishDate: string
  link: string
  tags: string[]
}
