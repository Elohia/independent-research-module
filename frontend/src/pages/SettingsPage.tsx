import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import type { AiSettings, SearchSettings } from '@/types'

const DEFAULT_SEARCH_SETTINGS: SearchSettings = {
  request_timeout_seconds: 8,
  providers: {
    policy: { enabled: true, priority: 100, max_results: 5, mode: 'local' },
    industry: { enabled: true, priority: 90, max_results: 5, mode: 'local' },
    risk: { enabled: true, priority: 80, max_results: 5, mode: 'local' },
  },
}

const DEFAULT_AI_SETTINGS: AiSettings = {
  mode: 'local',
  base_url: '',
  api_key: '',
  model: '',
  temperature: 0.2,
  request_timeout_seconds: 12,
}

function normalizeSearchSettings(value?: Partial<SearchSettings>): SearchSettings {
  return {
    request_timeout_seconds: value?.request_timeout_seconds ?? DEFAULT_SEARCH_SETTINGS.request_timeout_seconds,
    providers: {
      policy: { ...DEFAULT_SEARCH_SETTINGS.providers.policy, ...(value?.providers?.policy || {}) },
      industry: { ...DEFAULT_SEARCH_SETTINGS.providers.industry, ...(value?.providers?.industry || {}) },
      risk: { ...DEFAULT_SEARCH_SETTINGS.providers.risk, ...(value?.providers?.risk || {}) },
    },
  }
}

function normalizeAiSettings(value?: Partial<AiSettings>): AiSettings {
  return {
    ...DEFAULT_AI_SETTINGS,
    ...value,
  }
}

export function SettingsPage() {
  const queryClient = useQueryClient()
  const searchQuery = useQuery({ queryKey: ['search-settings'], queryFn: api.getSearchSettings })
  const aiQuery = useQuery({ queryKey: ['ai-settings'], queryFn: api.getAiSettings })
  const [searchForm, setSearchForm] = useState<SearchSettings>(DEFAULT_SEARCH_SETTINGS)
  const [aiForm, setAiForm] = useState<AiSettings>(DEFAULT_AI_SETTINGS)

  useEffect(() => {
    if (searchQuery.data) {
      setSearchForm(normalizeSearchSettings(searchQuery.data))
    }
  }, [searchQuery.data])

  useEffect(() => {
    if (aiQuery.data) {
      setAiForm(normalizeAiSettings(aiQuery.data))
    }
  }, [aiQuery.data])

  const searchMutation = useMutation({
    mutationFn: api.updateSearchSettings,
    onSuccess: (data) => {
      const normalized = normalizeSearchSettings(data)
      setSearchForm(normalized)
      queryClient.setQueryData(['search-settings'], normalized)
    },
  })

  const aiMutation = useMutation({
    mutationFn: api.updateAiSettings,
    onSuccess: (data) => {
      const normalized = normalizeAiSettings(data)
      setAiForm(normalized)
      queryClient.setQueryData(['ai-settings'], normalized)
    },
  })

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-[28px] border border-white/10 bg-slate-950/65 p-6">
        <div className="text-sm uppercase tracking-[0.3em] text-cyan-200/70">搜索源配置</div>
        <h1 className="mt-2 text-2xl font-semibold text-white">搜索提供方管理</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">`fallback` 会优先联网搜索，失败时自动回退到本地内置研究引擎，兼顾可用性和稳定性。</p>
        <form
          className="mt-5 space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            searchMutation.mutate(searchForm)
          }}
        >
          <label className="block space-y-2">
            <span className="text-sm text-slate-300">联网请求超时</span>
            <input
              type="number"
              min={2}
              max={30}
              value={searchForm.request_timeout_seconds}
              onChange={(event) => setSearchForm((current) => ({ ...current, request_timeout_seconds: Number(event.target.value) }))}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
            />
          </label>
          {Object.entries(searchForm.providers).map(([name, value]) => (
            <div key={name} className="rounded-3xl border border-white/5 bg-white/[0.03] p-4 text-sm text-slate-300">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-semibold capitalize text-white">{name}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">研究视角 provider</div>
                </div>
                <label className="inline-flex items-center gap-2 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={value.enabled}
                    onChange={(event) =>
                      setSearchForm((current) => ({
                        ...current,
                        providers: {
                          ...current.providers,
                          [name]: { ...current.providers[name], enabled: event.target.checked },
                        },
                      }))
                    }
                  />
                  启用
                </label>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.24em] text-slate-500">运行模式</span>
                  <select
                    value={value.mode}
                    onChange={(event) =>
                      setSearchForm((current) => ({
                        ...current,
                        providers: {
                          ...current.providers,
                          [name]: { ...current.providers[name], mode: event.target.value as 'fallback' | 'local' | 'web' },
                        },
                      }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
                  >
                    <option value="fallback">联网优先 + 本地回退</option>
                    <option value="web">仅联网搜索</option>
                    <option value="local">仅本地引擎</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.24em] text-slate-500">优先级</span>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={value.priority}
                    onChange={(event) =>
                      setSearchForm((current) => ({
                        ...current,
                        providers: {
                          ...current.providers,
                          [name]: { ...current.providers[name], priority: Number(event.target.value) },
                        },
                      }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.24em] text-slate-500">每轮最大结果</span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={value.max_results}
                    onChange={(event) =>
                      setSearchForm((current) => ({
                        ...current,
                        providers: {
                          ...current.providers,
                          [name]: { ...current.providers[name], max_results: Number(event.target.value) },
                        },
                      }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
                  />
                </label>
              </div>
            </div>
          ))}
          {searchMutation.error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{(searchMutation.error as Error).message}</div> : null}
          {searchMutation.isSuccess ? <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">搜索配置已保存，后续任务会按新的 provider 模式执行。</div> : null}
          <button type="submit" className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-500" disabled={searchMutation.isPending || searchQuery.isLoading}>
            {searchMutation.isPending ? '正在保存搜索配置...' : '保存搜索配置'}
          </button>
        </form>
      </section>
      <section className="rounded-[28px] border border-white/10 bg-slate-950/65 p-6">
        <div className="text-sm uppercase tracking-[0.3em] text-amber-200/70">AI 配置</div>
        <h1 className="mt-2 text-2xl font-semibold text-white">报告提炼设置</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">支持本地摘要和 OpenAI 兼容接口。若填入 GLM 等兼容地址，会自动规范化补全 `chat/completions` 路径。</p>
        <form
          className="mt-5 space-y-4 text-sm text-slate-300"
          onSubmit={(event) => {
            event.preventDefault()
            aiMutation.mutate(aiForm)
          }}
        >
          <label className="block space-y-2">
            <span className="text-sm text-slate-300">运行模式</span>
            <select
              value={aiForm.mode}
              onChange={(event) => setAiForm((current) => ({ ...current, mode: event.target.value as AiSettings['mode'] }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-400/40"
            >
              <option value="local">本地摘要</option>
              <option value="openai_compatible">外部兼容模型</option>
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-slate-300">Base URL</span>
            <input
              value={aiForm.base_url}
              onChange={(event) => setAiForm((current) => ({ ...current, base_url: event.target.value }))}
              placeholder="https://api.openai.com/v1 或 https://open.bigmodel.cn/api/paas/v4"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-amber-400/40"
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-slate-300">API Key</span>
              <input
                type="password"
                value={aiForm.api_key}
                onChange={(event) => setAiForm((current) => ({ ...current, api_key: event.target.value }))}
                placeholder="输入外部模型密钥"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-amber-400/40"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-slate-300">模型名</span>
              <input
                value={aiForm.model}
                onChange={(event) => setAiForm((current) => ({ ...current, model: event.target.value }))}
                placeholder="gpt-4o-mini / glm-4.5"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-amber-400/40"
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-slate-300">温度</span>
              <input
                type="number"
                min={0}
                max={1}
                step={0.1}
                value={aiForm.temperature}
                onChange={(event) => setAiForm((current) => ({ ...current, temperature: Number(event.target.value) }))}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-amber-400/40"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-slate-300">请求超时</span>
              <input
                type="number"
                min={5}
                max={60}
                value={aiForm.request_timeout_seconds}
                onChange={(event) => setAiForm((current) => ({ ...current, request_timeout_seconds: Number(event.target.value) }))}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-amber-400/40"
              />
            </label>
          </div>
          {aiMutation.error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{(aiMutation.error as Error).message}</div> : null}
          {aiMutation.isSuccess ? <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">AI 配置已保存，后续报告会按当前模式执行，并在外部模型失败时回退到本地摘要。</div> : null}
          <button type="submit" className="rounded-2xl bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-500" disabled={aiMutation.isPending || aiQuery.isLoading}>
            {aiMutation.isPending ? '正在保存 AI 配置...' : '保存 AI 配置'}
          </button>
        </form>
      </section>
    </div>
  )
}
