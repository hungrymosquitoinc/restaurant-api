import { Link } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'

export default function Cart() {
  const { items, updateQty, removeItem, total, count } = useCart()

  if (count === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">🛒</span>
        <h2>Your cart is empty</h2>
        <p>Add some delicious items from our menu!</p>
        <Link to="/menu" className="btn btn-primary">Browse Menu</Link>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <h1>Your Cart</h1>
      <div className="cart-items">
        {items.map(item => (
          <div key={item.id} className="cart-item">
            <div className="cart-item-info">
              <img className="cart-item-img" src={item.image || 'https://placehold.co/200x200/e0e0e0/999?text=No+Image'} alt={item.name} />
              <div>
                <h3>{item.name}</h3>
                <p className="cart-item-price">₱{item.price * item.quantity}</p>
              </div>
            </div>
            <div className="cart-item-controls">
              <button className="btn btn-sm" onClick={() => updateQty(item.id, item.quantity - 1)}>-</button>
              <span className="cart-qty">{item.quantity}</span>
              <button className="btn btn-sm" onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
              <button className="btn btn-sm btn-danger" onClick={() => removeItem(item.id)}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
      <div className="cart-summary">
        <div className="cart-total">
          <span>Total ({count} items)</span>
          <span className="total-amount">₱{total}</span>
        </div>
        <Link to="/checkout" className="btn btn-primary btn-block btn-lg">Proceed to Checkout</Link>
      </div>
    </div>
  )
}
