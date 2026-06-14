import { useCart } from '../contexts/CartContext'

export default function MenuItemCard({ item }) {
  const { addItem } = useCart()

  return (
    <div className="menu-item-card">
      <img className="menu-item-img" src={item.image || 'https://placehold.co/200x200/e0e0e0/999?text=No+Image'} alt={item.name} />
      <div className="menu-item-info">
        <h3>{item.name}</h3>
        <p className="menu-item-desc">{item.description}</p>
        <div className="menu-item-meta">
          <span className="menu-item-price">₱{item.price}</span>
          <button className="btn btn-sm btn-primary" onClick={() => addItem(item)}>+ Add</button>
        </div>
      </div>
    </div>
  )
}
