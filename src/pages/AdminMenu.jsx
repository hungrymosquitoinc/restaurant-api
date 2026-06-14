import { useState } from 'react'
import menuItems from '../data/menu'

const emptyItem = { name: '', description: '', price: '', category: '', image: '' };

export default function AdminMenu() {
  const [items, setItems] = useState([...menuItems])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ ...emptyItem })
  const [showModal, setShowModal] = useState(false)

  const toggleAvailable = (id) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, available: !i.available } : i))
  }

  const openAdd = () => {
    setForm({ ...emptyItem, category: 'Pizza' })
    setEditing(null)
    setShowModal(true)
  }

  const openEdit = (item) => {
    setForm({ ...item, price: String(item.price) })
    setEditing(item.id)
    setShowModal(true)
  }

  const deleteItem = (id) => {
    if (confirm('Delete this menu item?')) setItems(prev => prev.filter(i => i.id !== id))
  }

  const save = () => {
    if (!form.name || !form.price) return alert('Name and price required')
    const payload = { ...form, price: Number(form.price) }
    if (editing) setItems(prev => prev.map(i => i.id === editing ? { ...i, ...payload, id: i.id } : i))
    else setItems(prev => [...prev, { ...payload, id: Math.max(...prev.map(i => i.id), 0) + 1 }])
    setShowModal(false)
  }

  const categorized = [...new Set(items.map(i => i.category))].map(cat => ({
    category: cat,
    items: items.filter(i => i.category === cat)
  }))

  return (
    <div className="admin-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Menu Management</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Item</button>
      </div>
      <div className="menu-categories">
        {categorized.map(({ category, items: catItems }) => (
          <section key={category} className="menu-category-section">
            <h2>{category} ({catItems.length})</h2>
            <div className="admin-menu-list">
              {catItems.map(item => (
                <div key={item.id} className="admin-menu-item">
                  <div className="admin-menu-info">
                    <img className="menu-item-img" src={item.image || 'https://placehold.co/200x200/e0e0e0/999?text=No+Image'} alt={item.name} />
                    <div style={{ flex: 1 }}>
                      <strong>{item.name}</strong>
                      <p className="menu-item-desc">{item.description}</p>
                      <span className="menu-item-price">₱{item.price}</span>
                    </div>
                  </div>
                  <label className="toggle-switch" style={{ marginRight: 8 }}>
                    <input type="checkbox" checked={item.available !== false} onChange={() => toggleAvailable(item.id)} />
                    <span className="toggle-slider">{item.available !== false ? 'Active' : 'Hidden'}</span>
                  </label>
                  <button className="btn btn-sm" onClick={() => openEdit(item)} style={{ marginRight: 4 }}>✏️</button>
                  <button className="btn btn-sm btn-danger" onClick={() => deleteItem(item.id)}>🗑️</button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{editing ? 'Edit Item' : 'New Item'}</h2>
            <div className="form-group">
              <label>Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Item name" />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Price (₱)</label>
                <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0" />
              </div>
            </div>
            <div className="form-group">
              <label>Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {[...new Set(items.map(i => i.category))].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Image</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input type="file" accept="image/*" id="imageUpload" style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files[0]
                    if (!file) return
                    if (file.size > 5 * 1024 * 1024) return alert('Image must be under 5MB')
                    const reader = new FileReader()
                    reader.onload = ev => setForm({ ...form, image: ev.target.result })
                    reader.readAsDataURL(file)
                  }} />
                <button type="button" className="btn btn-sm" onClick={() => document.getElementById('imageUpload').click()}>
                  📁 Choose File
                </button>
                {form.image && !form.image.startsWith('data:') && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{form.image.split('/').pop()}</span>
                )}
              </div>
              {form.image && (
                <div style={{ position: 'relative', display: 'inline-block', marginTop: 8 }}>
                  <img src={form.image} alt="preview" style={{ width: 120, height: 120, borderRadius: 8, objectFit: 'cover', border: '2px solid var(--border)' }} />
                  <button type="button" className="btn btn-sm"
                    style={{ position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: '50%', padding: 0, fontSize: '0.8rem', lineHeight: 1, background: 'var(--danger)', color: '#fff', border: '2px solid #fff' }}
                    onClick={() => setForm({ ...form, image: '' })}>✕</button>
                </div>
              )}
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 6 }}>Max 5MB. Supports JPG, PNG, GIF, WebP.</p>
            </div>
            <div className="form-row" style={{ gap: 8, marginTop: 16 }}>
              <button className="btn btn-block" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-block" onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
