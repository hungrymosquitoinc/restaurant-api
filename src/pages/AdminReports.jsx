import { useMemo, useState, useRef } from 'react'
import { useOrder } from '../contexts/OrderContext'

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
  const printRef = useRef(null)

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
        <button className="btn btn-sm" onClick={() => window.print()} style={{ minWidth: 100 }}>
          🖨️ Print / Save PDF
        </button>
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
    </div>
  )
}