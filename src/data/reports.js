import { apiGet, apiPost } from '../lib/api'

export async function saveReport(periodType, periodDate) {
  return apiPost('/admin/save-report', { periodType, periodDate })
}

export async function getSavedReports() {
  return apiGet('/admin/saved-reports')
}

export async function deleteSavedReport(id) {
  const res = await fetch(`/api/admin/saved-reports/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete report')
  return res.json()
}
