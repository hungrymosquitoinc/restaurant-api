import { useMemo, useState, useRef, useEffect } from 'react'
import { useOrder } from '../contexts/OrderContext'
import { saveReport, getSavedReports, deleteSavedReport } from '../data/reports'

function getPeriodRange(period, customStart, customEnd) {
  const now = new Date()
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
  let start, end
  switch (period) {
    case 'today':
      start = startOfDay(now)
      end = new Date(start.getTime() + 86400000)
      break
    case 'week': {
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1)
      start = startOfDay(new Date(now.setDate(diff)))
      end = new Date(start.getTime() + 7 * 86400000)
      break
    }
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      break
    case 'year':
      start = new Date(now.getFullYear(), 0, 1)
      end = new Date(now.getFullYear() + 1, 0, 1)
      break
    case 'custom':
      start = customStart ? new Date(customStart) : null
      end = customEnd ? new Date(customEnd + 'T23:59:59') : null
      break
    default:
      start = null; end = null
  }
  return { start, end }
}

export default function AdminReports() {
  const { getAllOrders } = useOrder()
  const allOrders = getAllOrders()
  const [period, setPeriod] = useState('all')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [savedReports, setSavedReports] = useState([])
  const [saveMsg, setSaveMsg] = useState('')
  const [viewingReport, setViewingReport] = useState(null)
  const printRef = useRef(null)

  useEffect(() => { getSavedReports().then(setSavedReports).catch(() => {}) }, [])

  const handleSaveReport = async () => {
    const typeMap = { today: 'daily', week: 'daily', month: 'monthly', year: 'yearly', all: 'yearly', custom: 'daily' }
    const periodType = typeMap[period] || 'daily'
    setSaveMsg('Saving...')
    try {
      await saveReport(periodType)
      setSaveMsg('Report saved!')
      const updated = await getSavedReports()
      setSavedReports(updated)
    } catch (e) {
      setSaveMsg('Failed: ' + e.message)
    }
    setTimeout(() => setSaveMsg(''), 3000)
  }

  const handleDeleteReport = async (id) => {
    if (!window.confirm('Delete this saved report?')) return
    await deleteSavedReport(id)
    setSavedReports(prev => prev.filter(r => r.id !== id))
    if (viewingReport?.id === id) setViewingReport(null)
  }

  const { start, end } = getPeriodRange(period, customStart, customEnd)

  const filtered = useMemo(() => {
    if (!start && !end) return allOrders
    return allOrders.filter(o => {
      const t = new Date(o.createdAt).getTime()
      return (!start || t >= start.getTime()) && (!end || t <= end.getTime())
    })
  }, [allOrders, start, end])

  const completed = filtered.filter(o => o.status !== 'cancelled')

  const stats = useMemo(() => {
    const totalRevenue = completed.reduce((s, o) => s + o.total, 0)
    const totalOrders = completed.length
    const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0
    const dineIn = completed.filter(o => o.orderType === 'dine-in').length
    const takeout = completed.filter(o => o.orderType === 'takeout' || !o.orderType).length
    const guestOrders = completed.filter(o => o.userId === null).length

    const itemCounts = {}
    completed.forEach(o => o.items.forEach(i => {
      itemCounts[i.name] = (itemCounts[i.name] || 0) + i.quantity
    }))
    const popularItems = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 10)

    const catRevenue = {}
    completed.forEach(o => o.items.forEach(i => {
      const cat = i.category || 'Other'
      catRevenue[cat] = (catRevenue[cat] || 0) + i.price * i.quantity
    }))
    const byCategory = Object.entries(catRevenue).sort((a, b) => b[1] - a[1])

    const dayTotals = {}
    completed.forEach(o => {
      const d = new Date(o.createdAt).toLocaleDateString()
      dayTotals[d] = (dayTotals[d] || 0) + 1
    })
    const byDay = Object.entries(dayTotals)

    const paymentMethods = {}
    completed.forEach(o => {
      const method = o.payment?.method || 'Cash on Delivery'
      if (!paymentMethods[method]) paymentMethods[method] = { count: 0, revenue: 0 }
      paymentMethods[method].count++
      paymentMethods[method].revenue += o.total
    })
    const byPayment = Object.entries(paymentMethods).sort((a, b) => b[1].count - a[1].count)

    return { totalRevenue, totalOrders, avgOrder, dineIn, takeout, guestOrders, popularItems, byCategory, byDay, byPayment }
  }, [completed])

  const periodLabel = { today: 'Today', week: 'This Week', month: 'This Month', year: 'This Year', all: 'All Time', custom: 'Custom Range' }[period]

  return (
    <div className="admin-page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>Sales & Reports</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {saveMsg && <span style={{ fontSize: '0.85rem', color: saveMsg.includes('Failed') ? 'var(--error)' : 'var(--success)' }}>{saveMsg}</span>}
          <button className="btn btn-sm btn-primary" onClick={handleSaveReport}>💾 Save Report</button>
          <button className="btn btn-sm" onClick={() => window.print()} style={{ minWidth: 100 }}>
            🖨️ Print / Save PDF
          </button>
        </div>
      </div>

      <div className="filter-tabs">
        {['today', 'week', 'month', 'year', 'all'].map(p => (
          <button key={p} className={`cat-tab ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>
            {periodLabel[p]}
          </button>
        ))}
        <button className={`cat-tab ${period === 'custom' ? 'active' : ''}`} onClick={() => setPeriod('custom')}>
          Custom
        </button>
      </div>

      {period === 'custom' && (
        <div className="form-row" style={{ marginBottom: 18 }}>
          <div className="form-group">
            <label>From</label>
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} />
          </div>
          <div className="form-group">
            <label>To</label>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
          </div>
        </div>
      )}

      <div ref={printRef} className="report-print-area">
        <div className="report-header" style={{ display: 'none' }}>
          <h2>Sales Report — {periodLabel}</h2>
          {period !== 'all' && period !== 'custom' && (
            <p style={{ color: 'var(--text-secondary)' }}>
              {new Date(start).toLocaleDateString()} — {new Date(end - 1).toLocaleDateString()}
            </p>
          )}
          {period === 'custom' && customStart && customEnd && (
            <p style={{ color: 'var(--text-secondary)' }}>
              {new Date(customStart).toLocaleDateString()} — {new Date(customEnd).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="stats-grid">
          <div className="stat-card revenue"><span className="stat-value">₱{stats.totalRevenue}</span><span className="stat-label">Revenue ({periodLabel})</span></div>
          <div className="stat-card"><span className="stat-value">{stats.totalOrders}</span><span className="stat-label">Orders</span></div>
          <div className="stat-card"><span className="stat-value">₱{stats.avgOrder}</span><span className="stat-label">Avg Order</span></div>
        </div>

        <div className="stats-grid">
          <div className="stat-card"><span className="stat-value">{stats.dineIn}</span><span className="stat-label">Dine In</span></div>
          <div className="stat-card"><span className="stat-value">{stats.takeout}</span><span className="stat-label">Takeout</span></div>
          <div className="stat-card" style={{ borderTopColor: '#9c27b0' }}><span className="stat-value">{stats.guestOrders}</span><span className="stat-label">Guest Orders</span></div>
        </div>

        <section>
          <h2>Popular Items</h2>
          <div className="report-list">
            {stats.popularItems.map(([name, qty], i) => (
              <div key={name} className="report-row">
                <span className="report-rank">#{i + 1}</span>
                <span className="report-name">{name}</span>
                <span className="report-value">{qty} sold</span>
              </div>
            ))}
            {stats.popularItems.length === 0 && <p className="text-muted">No orders yet</p>}
          </div>
        </section>

        <section>
          <h2>Revenue by Category</h2>
          <div className="report-list">
            {stats.byCategory.map(([cat, rev]) => (
              <div key={cat} className="report-row">
                <span className="report-name">{cat}</span>
                <span className="report-value">₱{rev}</span>
              </div>
            ))}
            {stats.byCategory.length === 0 && <p className="text-muted">No orders yet</p>}
          </div>
        </section>

        <section>
          <h2>Payment Methods</h2>
          <div className="report-list">
            {stats.byPayment.map(([method, data]) => (
              <div key={method} className="report-row">
                <span className="report-name">{method === 'Credit Card' ? '💳' : '💵'} {method}</span>
                <span className="report-value">{data.count} orders — ₱{data.revenue}</span>
              </div>
            ))}
            {stats.byPayment.length === 0 && <p className="text-muted">No orders yet</p>}
          </div>
        </section>

        {stats.byDay.length > 0 && (
          <section>
            <h2>Daily Breakdown</h2>
            <div className="report-list">
              {stats.byDay.map(([day, count]) => (
                <div key={day} className="report-row">
                  <span className="report-name">{day}</span>
                  <span className="report-value">{count} orders</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {completed.length > 0 && (
          <section>
            <h2>Order Details</h2>
            <div className="report-list">
              {completed.map(o => (
                <div key={o.id} className="report-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>{o.id}</strong>
                    <span>₱{o.total}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {o.items.map(i => `${i.name} x${i.quantity}`).join(', ')}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{o.orderType === 'dine-in' ? 'Dine-in' : 'Takeout'} · {o.payment?.method || 'Cash'}{!o.userId && o.delivery?.guestName ? ` · Guest: ${o.delivery.guestName}` : ''}</span>
                    <span>{new Date(o.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <section style={{ marginTop: 40 }}>
        <h2>Saved Reports</h2>
        {savedReports.length === 0 ? (
          <p className="text-muted">No saved reports yet. Click "Save Report" above to create one.</p>
        ) : (
          <div className="admin-menu-list">
            {savedReports.map(r => (
              <div key={r.id} className="admin-menu-item" style={{ cursor: 'pointer' }} onClick={() => setViewingReport(viewingReport?.id === r.id ? null : r)}>
                <div className="admin-menu-info">
                  <div style={{ flex: 1 }}>
                    <strong>{r.label}</strong>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '2px 0' }}>
                      {r.period_type} · ₱{r.total_revenue} · {r.total_orders} orders · {new Date(r.created_at).toLocaleDateString()}
                    </p>
                    {viewingReport?.id === r.id && (
                      <div style={{ marginTop: 8, padding: 12, background: 'var(--bg-secondary)', borderRadius: 8, fontSize: '0.85rem' }}>
                        <div className="stats-grid" style={{ marginBottom: 12 }}>
                          <div className="stat-card revenue"><span className="stat-value">₱{r.total_revenue}</span><span className="stat-label">Revenue</span></div>
                          <div className="stat-card"><span className="stat-value">{r.total_orders}</span><span className="stat-label">Orders</span></div>
                          <div className="stat-card"><span className="stat-value">₱{r.avg_order_value}</span><span className="stat-label">Avg Order</span></div>
                        </div>
                        <div className="stats-grid" style={{ marginBottom: 12 }}>
                          <div className="stat-card"><span className="stat-value">{r.dine_in_count}</span><span className="stat-label">Dine In</span></div>
                          <div className="stat-card"><span className="stat-value">{r.takeout_count}</span><span className="stat-label">Takeout</span></div>
                          <div className="stat-card"><span className="stat-value">{r.guest_orders}</span><span className="stat-label">Guests</span></div>
                        </div>
                        {Array.isArray(r.popular_items) && r.popular_items.length > 0 && (
                          <div style={{ marginBottom: 8 }}>
                            <strong>Popular Items</strong>
                            {r.popular_items.map((item, i) => (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                                <span>{item.name}</span><span>{item.qty} sold</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {Array.isArray(r.revenue_by_category) && r.revenue_by_category.length > 0 && (
                          <div style={{ marginBottom: 8 }}>
                            <strong>Revenue by Category</strong>
                            {r.revenue_by_category.map((cat, i) => (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                                <span>{cat.category}</span><span>₱{cat.revenue}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); handleDeleteReport(r.id) }}
                  style={{ minWidth: 44, padding: '8px 12px', fontSize: '1rem' }}>🗑</button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}