import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const BANKS = [
  'BDO', 'BPI', 'Metrobank', 'Landbank', 'UnionBank',
  'Security Bank', 'EastWest Bank', 'RCBC', 'Chinabank', 'PNB',
  'PSBank', 'Bank of Commerce', 'UCPB', 'DBP', 'Maybank',
  'Philtrust Bank', 'AUB', 'Robinsons Bank', 'Hong Leong Bank',
  'CIMB Bank', 'ING', 'Tonik Bank', 'Sun Savings Bank',
  'Wealth Development Bank', 'Philippine Bank of Communications',
  'Sterling Bank of Asia', 'Allied Bank (now PNB)',
]

const FINTECHS = [
  'GCash', 'Maya', 'GoTyme', 'Seabank', 'GrabPay', 'ShopeePay',
  'Coins.ph', 'PalawanPay', 'Pay & Go', 'Starpay', 'USSC',
  'BDO Pay', 'BPI Mobile', 'UnionBank Online', 'UNA Bank',
  'DiskarTech', 'Tonik Digital', 'Uno Digital Bank',
  'NetBank', 'OmniPay', 'DAWAh', 'E-wallet Pay',
]

const CRYPTO = [
  'USDT (Tether)', 'USDC', 'BTC (Bitcoin)', 'ETH (Ethereum)',
  'XRP (Ripple)', 'SOL (Solana)', 'BNB (Binance Coin)',
  'ADA (Cardano)', 'TRX (TRON)', 'MATIC (Polygon)',
  'TON (Toncoin)', 'DOT (Polkadot)', 'AVAX (Avalanche)',
  'LTC (Litecoin)', 'DOGE (Dogecoin)', 'XLM (Stellar)',
  'DAI', 'BCH (Bitcoin Cash)', 'ATOM (Cosmos)', 'LINK (Chainlink)',
]

const NETWORKS = [
  'ERC-20 (Ethereum)', 'TRC-20 (TRON)', 'BEP-20 (BNB Smart Chain)',
  'Solana', 'XRP Ledger', 'Stellar', 'Polygon',
  'Bitcoin', 'Litecoin', 'Dogecoin',
  'Avalanche C-Chain', 'Arbitrum', 'Optimism', 'Base',
  'Cosmos', 'TON', 'Cronos', 'Fantom',
]

const PROVIDER_LABELS = {
  bank: { label: 'Bank Account', icon: '🏦' },
  fintech: { label: 'Fintech / E-Wallet', icon: '📱' },
  crypto: { label: 'Crypto', icon: '₿' },
}

const PROVIDER_LISTS = { bank: BANKS, fintech: FINTECHS, crypto: CRYPTO }

const emptyMethod = { type: 'bank', name: '', accountName: '', accountNumber: '', isActive: true, customName: '', network: '', memoTag: '', qrImage: '' }

export default function AdminPayments() {
  const [methods, setMethods] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ ...emptyMethod })
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [showVerify, setShowVerify] = useState(false)

  const loadMethods = async () => {
    const { data } = await supabase.from('payment_methods').select('*').order('created_at')
    if (data) setMethods(data)
  }

  useEffect(() => { loadMethods() }, [])

  const saveMethods = async (updated) => {
    setMethods(updated)
  }

  const openAdd = () => {
    setForm({ ...emptyMethod })
    setEditing(null)
    setShowModal(true)
  }

  const openEdit = (m) => {
    setForm({ ...m, isActive: m.isActive })
    setEditing(m.id)
    setShowModal(true)
  }

  const deleteMethod = (id) => {
    setConfirmDelete(methods.find(m => m.id === id))
  }

  const confirmDeleteMethod = async () => {
    if (!confirmDelete) return
    await supabase.from('payment_methods').delete().eq('id', confirmDelete.id)
    setMethods(prev => prev.filter(m => m.id !== confirmDelete.id))
    setConfirmDelete(null)
  }

  const toggleActive = async (id) => {
    const m = methods.find(x => x.id === id)
    if (!m) return
    await supabase.from('payment_methods').update({ is_active: !m.isActive }).eq('id', id)
    setMethods(prev => prev.map(x => x.id === id ? { ...x, isActive: !x.isActive } : x))
  }

  const submitForm = () => {
    if (!form.name) return alert('Please select or enter a provider name')
    if (!form.accountNumber) return alert('Please enter an account number or wallet address')
    if (form.type === 'crypto' && !form.network) return alert('Please select a network/chain for crypto payments')
    setShowModal(false)
    setShowVerify(true)
  }

  const confirmSave = async () => {
    const payload = {
      type: form.type,
      name: form.name,
      account_name: form.accountName,
      account_number: form.accountNumber,
      custom_name: form.customName || '',
      network: form.network || '',
      memo_tag: form.memoTag || '',
      qr_image: form.qrImage || '',
      is_active: true,
    }
    if (editing) {
      await supabase.from('payment_methods').update(payload).eq('id', editing)
    } else {
      await supabase.from('payment_methods').insert(payload)
    }
    setShowVerify(false)
    loadMethods()
  }

  const byType = [
    { type: 'bank', methods: methods.filter(m => m.type === 'bank') },
    { type: 'fintech', methods: methods.filter(m => m.type === 'fintech') },
    { type: 'crypto', methods: methods.filter(m => m.type === 'crypto') },
  ]

  return (
    <div className="admin-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Payment Methods</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Method</button>
      </div>

      <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
        Configure payment options that customers can use to pay directly.
      </p>

      {methods.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">💳</span>
          <h2>No payment methods yet</h2>
          <p>Add bank accounts, e-wallet, or crypto options for your customers</p>
        </div>
      ) : (
        byType.map(({ type, methods: group }) => group.length > 0 && (
          <section key={type} style={{ marginBottom: 24 }}>
            <h2>{PROVIDER_LABELS[type].icon} {PROVIDER_LABELS[type].label}s</h2>
            <div className="admin-menu-list">
              {group.map(m => (
                <div key={m.id} className="admin-menu-item">
                  <div className="admin-menu-info">
                    <span style={{ fontSize: '2rem' }}>{PROVIDER_LABELS[m.type]?.icon || '💳'}</span>
                    <div style={{ flex: 1 }}>
                      <strong>{m.name}</strong>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '2px 0' }}>
                        {m.account_name} — {m.account_number}
                      </p>
                      {m.type === 'crypto' && m.network && (
                        <p style={{ fontSize: '0.75rem', color: '#7b1fa2', margin: 0 }}>
                          ⛓️ {m.network}{m.memo_tag ? `  |  🏷️ Tag: ${m.memo_tag}` : ''}
                        </p>
                      )}
                    </div>
                    {m.qr_image && <img src={m.qr_image} alt="QR" style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover' }} />}
                  </div>
                  <label className="toggle-switch" style={{ marginRight: 8 }}>
                    <input type="checkbox" checked={m.isActive} onChange={() => toggleActive(m.id)} />
                    <span className="toggle-slider">{m.isActive ? 'Active' : 'Hidden'}</span>
                  </label>
                  <button className="btn btn-sm" onClick={() => openEdit(m)} style={{ marginRight: 4 }}>✏️</button>
                  <button className="btn btn-sm btn-danger" onClick={() => deleteMethod(m.id)}>🗑️</button>
                </div>
              ))}
            </div>
          </section>
        ))
      )}

      {showVerify && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editing ? 'Confirm Changes' : 'Verify Payment Method'}</h2>
            <div style={{ background: '#f5f5f5', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: '2rem' }}>{PROVIDER_LABELS[form.type]?.icon || '💳'}</span>
                <div>
                  <strong style={{ fontSize: '1.1rem' }}>{form.name}</strong>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{PROVIDER_LABELS[form.type]?.label}</p>
                </div>
              </div>
              <div style={{ borderTop: '1px solid #ddd', paddingTop: 12 }}>
                <p style={{ fontSize: '0.9rem', marginBottom: 4 }}><strong>Account Name:</strong> {form.accountName}</p>
                <p style={{ fontSize: '0.9rem', marginBottom: 4 }}><strong>{form.type === 'crypto' ? 'Wallet Address' : 'Account Number'}:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{form.accountNumber}</span></p>
                {form.type === 'crypto' && form.network && (
                  <p style={{ fontSize: '0.9rem', marginBottom: 4 }}><strong>Network:</strong> {form.network}</p>
                )}
                {form.type === 'crypto' && form.memoTag && (
                  <p style={{ fontSize: '0.9rem', marginBottom: 4 }}><strong>Dest. Tag / Memo:</strong> {form.memoTag}</p>
                )}
              </div>
              {form.qrImage && (
                <div style={{ textAlign: 'center', marginTop: 12 }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>Scan to pay</p>
                  <img src={form.qrImage} alt="QR" style={{ width: 140, height: 140, borderRadius: 8, objectFit: 'contain', border: '2px solid var(--border)' }} />
                </div>
              )}
            </div>
            <div className="form-row" style={{ gap: 8 }}>
              <button className="btn btn-block" onClick={() => setShowVerify(false)}>Edit Details</button>
              <button className="btn btn-primary btn-block" onClick={confirmSave}>Confirm & Save</button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Delete Payment Method?</h2>
            <p style={{ marginBottom: 16 }}>Are you sure you want to remove <strong>{confirmDelete.name}</strong> ({confirmDelete.account_name})?</p>
            <p style={{ fontSize: '0.85rem', color: '#e65100', marginBottom: 16 }}>⚠️ Customers will no longer be able to pay using this method.</p>
            <div className="form-row" style={{ gap: 8 }}>
              <button className="btn btn-block" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger btn-block" onClick={confirmDeleteMethod}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editing ? 'Edit Method' : 'New Payment Method'}</h2>
            <div className="form-group">
              <label>Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value, name: '', customName: '' })}>
                <option value="bank">🏦 Bank Account</option>
                <option value="fintech">📱 Fintech / E-Wallet</option>
                <option value="crypto">₿ Crypto</option>
              </select>
            </div>
            <div className="form-group">
              <label>Provider Name</label>
              <select value={form.customName === 'yes' ? '__other__' : form.name} onChange={e => {
                if (e.target.value === '__other__') setForm({ ...form, name: '', customName: 'yes' })
                else setForm({ ...form, name: e.target.value, customName: '' })
              }}>
                <option value="" disabled>Select provider</option>
                {(PROVIDER_LISTS[form.type] || []).map(p => <option key={p} value={p}>{p}</option>)}
                <option value="__other__">Other...</option>
              </select>
              {form.customName === 'yes' && (
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Type provider name" style={{ marginTop: 8 }} />
              )}
            </div>
            <div className="form-group">
              <label>Account Name</label>
              <input value={form.accountName} onChange={e => setForm({ ...form, accountName: e.target.value })} placeholder="e.g. Zpectrum Restobar" />
            </div>
            <div className="form-group">
              <label>{form.type === 'crypto' ? 'Wallet Address' : 'Account Number'}</label>
              <input value={form.accountNumber} onChange={e => setForm({ ...form, accountNumber: e.target.value })} placeholder={form.type === 'crypto' ? 'e.g. 0x1234... / bc1q...' : 'e.g. 123-456-7890 / 0917 123 4567'} />
            </div>
            <div className="form-group">
              <label>QR Code <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(optional)</span></label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input type="file" accept="image/*" id="qrUpload" style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files[0]
                    if (!file) return
                    if (file.size > 2 * 1024 * 1024) return alert('QR image must be under 2MB')
                    const reader = new FileReader()
                    reader.onload = ev => setForm({ ...form, qrImage: ev.target.result })
                    reader.readAsDataURL(file)
                  }} />
                <button type="button" className="btn btn-sm" onClick={() => document.getElementById('qrUpload').click()}>
                  📷 Upload QR
                </button>
                {form.qrImage && (
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => setForm({ ...form, qrImage: '' })}>
                    Remove
                  </button>
                )}
              </div>
              {form.qrImage && (
                <img src={form.qrImage} alt="QR preview" style={{ width: 120, height: 120, borderRadius: 8, marginTop: 8, objectFit: 'contain', border: '2px solid var(--border)' }} />
              )}
            </div>
            {form.type === 'crypto' && (
              <>
                <div className="form-group">
                  <label>Network / Chain <span style={{ color: '#e65100', fontWeight: 700 }}>*</span></label>
                  <select value={form.network} onChange={e => setForm({ ...form, network: e.target.value })}>
                    <option value="">Select network</option>
                    {NETWORKS.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <p style={{ fontSize: '0.75rem', color: '#e65100', marginTop: 4 }}>⚠️ Sending on the wrong network may result in lost funds</p>
                </div>
                <div className="form-group">
                  <label>Destination Tag / Memo <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(optional)</span></label>
                  <input value={form.memoTag} onChange={e => setForm({ ...form, memoTag: e.target.value })} placeholder="Required for XRP, XLM, BNB, ATOM, TON if using exchange wallet" />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>Required if wallet address is from an exchange (e.g. Binance, Coinbase)</p>
                </div>
              </>
            )}
            <div className="form-row" style={{ gap: 8, marginTop: 16 }}>
              <button className="btn btn-block" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-block" onClick={submitForm}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
