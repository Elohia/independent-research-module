export type SearchConfigInput = {
  max_threads: number
  max_iterations: number
  coverage_threshold: number
  timeout_seconds: number
  providers: string[]
  expansion_modes: string[]
}

export type ResearchQuestionPayload = {
  title: string
  problem_statement: string
  objectives: string[]
  constraints: string[]
  exclusions: string[]
  expected_output: string
  search_config: SearchConfigInput
}

export type TaskProgress = {
  current_stage: string
  iteration: number
  coverage_score: number
  source_count: number
  result_count: number
  warnings: string[]
}

export type ResearchTask = {
  id: string
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  created_at: string
  updated_at: string
  question: ResearchQuestionPayload
  analysis: Record<string, unknown>
  progress: TaskProgress
}

export type EvidenceItem = {
  title: string
  source: string
  url?: string
  snippet?: string
  score: number
  tags: string[]
  dimension: string
  provider: string
}

export type ReportSection = {
  key: string
  title: string
  content: string
}

export type ResearchReport = {
  task_id: string
  summary: string
  sections: ReportSection[]
  evidence: EvidenceItem[]
  generated_at: string
}

export type SearchSettings = {
  request_timeout_seconds: number
  providers: Record<string, { enabled: boolean; priority: number; max_results: number; mode: 'fallback' | 'local' | 'web' }>
}

export type AiSettings = {
  mode: 'local' | 'openai_compatible'
  base_url: string
  api_key: string
  model: string
  temperature: number
  request_timeout_seconds: number
}
