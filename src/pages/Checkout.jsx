import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useOrder } from '../contexts/OrderContext'

const API = '/api'

const PAYMONGO_METHODS = {
  gcash: { label: 'GCash', icon: '📱' },
  maya: { label: 'Maya', icon: '📱' },
  grab_pay: { label: 'GrabPay', icon: '📱' },
  card: { label: 'Credit / Debit Card', icon: '💳' },
}

function loadPaymongoCallback() {
  try {
    const data = localStorage.getItem('paymongo_callback')
    if (data) {
      localStorage.removeItem('paymongo_callback')
      return JSON.parse(data)
    }
  } catch {}
  return null
}

function loadSavedPayment() {
  try { return localStorage.getItem('bb_selected_payment') || 'cash' }
  catch { return 'cash' }
}

function savePayment(value) {
  try { localStorage.setItem('bb_selected_payment', value) } catch {}
}

function loadSavedCard() {
  try { return JSON.parse(localStorage.getItem('bb_saved_card')) || {} }
  catch { return {} }
}

function saveCard(details) {
  try { localStorage.setItem('bb_saved_card', JSON.stringify(details)) } catch {}
}

export default function Checkout() {
  const { user } = useAuth()
  const { items, total, clearCart } = useCart()
  const { placeOrder, createPendingOrder, confirmPendingOrder } = useOrder()
  const navigate = useNavigate()

  const callbackRef = useRef(loadPaymongoCallback())

  const savedCard = loadSavedCard()
  const [orderType, setOrderType] = useState('dine-in')
  const [tableNumber, setTableNumber] = useState('')
  const [address, setAddress] = useState('123 Main St, Foodville')
  const [notes, setNotes] = useState('')
  const [payment, setPayment] = useState(loadSavedPayment)
  const [step, setStep] = useState(callbackRef.current ? 'processing' : 'review')
  const [cardNum, setCardNum] = useState(savedCard.cardNum || '')
  const [cardName, setCardName] = useState(savedCard.cardName || '')
  const [cardExp, setCardExp] = useState(savedCard.cardExp || '')
  const [cardCvv, setCardCvv] = useState(savedCard.cardCvv || '')
  const [savedMethods, setSavedMethods] = useState([])
  const [paymongoConfigured, setPaymongoConfigured] = useState(false)
  const [paymongoMethods, setPaymongoMethods] = useState([])
  const [paymongoLoading, setPaymongoLoading] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [paymongoError, setPaymongoError] = useState('')
  const [paymentMessage, setPaymentMessage] = useState('')

  const activeMethods = savedMethods.filter(m => m.is_active !== false)

  // Load payment methods from Supabase
  useEffect(() => {
    supabase.from('payment_methods').select('*').then(({ data }) => {
      if (data) setSavedMethods(data)
    })
  }, [])

  // Check PayMongo config on mount
  useEffect(() => {
    fetch(`${API}/payments/config`)
      .then(r => r.json())
      .then(data => {
        if (data.configured) {
          setPaymongoConfigured(true)
          setPaymongoMethods(data.methods || [])
        }
      })
      .catch(() => {})
  }, [])

  // Handle PayMongo redirect callback
  const handleCallback = useCallback(() => {
    const callback = callbackRef.current
    if (!callback || !callback.sourceId) return false

    setStep('processing')
    setPaymentMessage('Verifying payment...')

    const pollStatus = (retries = 30) => {
      fetch(`${API}/payments/${callback.sourceId}/status`)
        .then(r => r.json())
        .then(async (data) => {
          if (data.paymentStatus === 'paid') {
            const order = await confirmPendingOrder()
            if (order) {
              clearCart()
              setStep('success')
              setPaymentMessage(`Payment successful! Your order has been placed.`)
            }
          } else if (data.paymentStatus === 'failed') {
            setStep('review')
            setPaymongoError('Payment failed. Please try again.')
          } else if (retries > 0) {
            setTimeout(() => pollStatus(retries - 1), 2000)
          } else {
            setStep('review')
            setPaymongoError('Payment is taking longer than expected. Please check your orders or contact support.')
          }
        })
        .catch(() => {
          if (retries > 0) {
            setTimeout(() => pollStatus(retries - 1), 2000)
          } else {
            setStep('review')
            setPaymongoError('Could not verify payment status. Please check your orders.')
          }
        })
    }

    pollStatus()
    return true
  }, [confirmPendingOrder, clearCart, callbackRef])

  useEffect(() => {
    handleCallback()
  }, [handleCallback])

  if (items.length === 0 && step === 'review') {
    return (
      <div className="empty-state">
        <span className="empty-icon">🛒</span>
        <h2>Nothing to checkout</h2>
        <p>Add items to your cart first</p>
        <Link to="/menu" className="btn btn-primary">Browse Menu</Link>
      </div>
    )
  }

  const typeIcon = (type) => type === 'bank' ? '🏦' : type === 'crypto' ? '₿' : '📱'

  const getPaymentLabel = () => {
    if (payment === 'cash') return 'Cash on Delivery'
    if (payment.startsWith('paymongo_')) {
      const type = payment.replace('paymongo_', '')
      const m = PAYMONGO_METHODS[type]
      return m ? `${m.icon} ${m.label}` : payment
    }
    const m = activeMethods.find(p => String(p.id) === payment)
    return m ? `${typeIcon(m.type)} ${m.name}` : 'Cash on Delivery'
  }

  useEffect(() => { savePayment(payment) }, [payment])

  useEffect(() => {
    saveCard({ cardNum, cardName, cardExp, cardCvv })
  }, [cardNum, cardName, cardExp, cardCvv])

  const isPaymongoMethod = () => payment.startsWith('paymongo_')

  const getPaymongoType = () => {
    if (!isPaymongoMethod()) return null
    return payment.replace('paymongo_', '')
  }

  const getOrderUserId = () => user ? user.id : null
  const getOrderCustomerName = () => user ? user.name : guestName

  const validateGuest = () => {
    if (user) return true
    if (!guestName.trim()) { setPaymongoError('Please enter your name'); return false }
    if (!guestPhone.trim()) { setPaymongoError('Please enter your phone number'); return false }
    return true
  }

  const handlePaymongoPayment = async () => {
    if (!validateGuest()) return
    setPaymongoLoading(true)
    setPaymongoError('')
    setPaymentMessage('')

    try {
      const type = getPaymongoType()
      const amountInCents = Math.round(total * 100)
      const callbackUrl = `${window.location.protocol}//${window.location.host}/payment-callback.html`

      const delivery = orderType === 'takeout' ? { address, notes }
        : { table: tableNumber || 'Walk-in', notes }
      if (!user) delivery.guestName = guestName
      if (!user) delivery.guestPhone = guestPhone

      createPendingOrder(items, total, getOrderUserId(), delivery, orderType, {
        method: PAYMONGO_METHODS[type].label,
        status: 'pending_payment',
      })

      const response = await fetch(`${API}/payments/create-source`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          amount: amountInCents,
          successUrl: callbackUrl,
          failedUrl: callbackUrl,
          orderRef: `pending-${getOrderUserId() || 'guest'}-${Date.now()}`,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment')
      }

      const pending = JSON.parse(localStorage.getItem('bb_pending_order') || '{}')
      pending.payment.paymongoSourceId = data.sourceId
      localStorage.setItem('bb_pending_order', JSON.stringify(pending))

      window.location.href = data.checkoutUrl
    } catch (err) {
      setPaymongoError(err.message || 'Payment initiation failed')
      setPaymongoLoading(false)
    }
  }

  const handleCashPayment = async () => {
    if (!validateGuest()) return
    const delivery = orderType === 'takeout' ? { address, notes }
      : { table: tableNumber || 'Walk-in', notes }
    if (!user) delivery.guestName = guestName
    if (!user) delivery.guestPhone = guestPhone
    const order = await placeOrder(items, total, getOrderUserId(), delivery, orderType, { method: 'Cash on Delivery', status: 'paid' })
    clearCart()
    if (user) navigate(`/orders/${order.id}`)
    else { setStep('success'); setPaymentMessage(`Order confirmed! Your order ID is ${order.id}. Please wait for our team.`) }
  }

  const handleManualPayment = async () => {
    if (!validateGuest()) return
    const delivery = orderType === 'takeout' ? { address, notes }
      : { table: tableNumber || 'Walk-in', notes }
    if (!user) delivery.guestName = guestName
    if (!user) delivery.guestPhone = guestPhone
    const m = activeMethods.find(p => String(p.id) === payment)
    const order = await placeOrder(items, total, getOrderUserId(), delivery, orderType, {
      method: m.name,
      status: 'paid',
      accountName: m.account_name,
      accountNumber: m.account_number,
      provider: m.name,
      type: m.type,
      ...(m.type === 'crypto' ? { network: m.network, memoTag: m.memo_tag } : {}),
    })
    clearCart()
    if (user) navigate(`/orders/${order.id}`)
    else { setStep('success'); setPaymentMessage(`Order confirmed! Your order ID is ${order.id}. Please complete the transfer.`) }
  }

  const handlePay = async () => {
    if (payment === 'cash') {
      await handleCashPayment()
    } else if (isPaymongoMethod()) {
      await handlePaymongoPayment()
    } else {
      await handleManualPayment()
    }
  }

  const renderPaymentSection = () => (
    <section className="checkout-section">
      <h2>Payment Method</h2>
      <div className="payment-options">

        {paymongoConfigured && paymongoMethods.map(m => (
          <label key={`paymongo_${m.type}`}
            className={`payment-option ${payment === `paymongo_${m.type}` ? 'selected' : ''}`}>
            <input type="radio" name="payment" value={`paymongo_${m.type}`}
              checked={payment === `paymongo_${m.type}`}
              onChange={() => setPayment(`paymongo_${m.type}`)} />
            {m.icon} {m.label} <span className="payment-badge payment-badge-online">Online</span>
          </label>
        ))}

        <label className={`payment-option ${payment === 'cash' ? 'selected' : ''}`}>
          <input type="radio" name="payment" value="cash" checked={payment === 'cash'} onChange={() => setPayment('cash')} />
          💵 Cash on Delivery
        </label>

        {activeMethods.map(m => (
          <label key={m.id} className={`payment-option ${payment === String(m.id) ? 'selected' : ''}`}>
            <input type="radio" name="payment" value={String(m.id)} checked={payment === String(m.id)} onChange={() => setPayment(String(m.id))} />
            {typeIcon(m.type)} {m.name} <span className="payment-badge payment-badge-manual">Manual</span>
          </label>
        ))}
      </div>

      {isPaymongoMethod() && (
        <div style={{ background: '#e8f5e9', borderRadius: 12, padding: 16, marginTop: 12 }}>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>
            🔒 {PAYMONGO_METHODS[getPaymongoType()]?.label} Online Payment
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            You will be redirected to PayMongo's secure checkout page to complete your payment via {PAYMONGO_METHODS[getPaymongoType()]?.label}.
          </p>
        </div>
      )}

      {payment === 'card' && (
        <div className="card-form">
          <div className="form-group">
            <label>Card Number</label>
            <input type="text" value={cardNum} onChange={e => setCardNum(e.target.value)} placeholder="4242 4242 4242 4242" />
          </div>
          <div className="form-group">
            <label>Cardholder Name</label>
            <input type="text" value={cardName} onChange={e => setCardName(e.target.value)} placeholder="John Doe" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Expiry</label>
              <input type="text" value={cardExp} onChange={e => setCardExp(e.target.value)} placeholder="MM/YY" />
            </div>
            <div className="form-group">
              <label>CVV</label>
              <input type="text" value={cardCvv} onChange={e => setCardCvv(e.target.value)} placeholder="123" />
            </div>
          </div>
        </div>
      )}

      {payment !== 'cash' && !isPaymongoMethod() && payment !== 'card' && (() => {
        const m = activeMethods.find(p => String(p.id) === payment)
        return m ? (
          <div style={{ background: '#f5f5f5', borderRadius: 12, padding: 16, marginTop: 12 }}>
            {m.qr_image && (
              <div style={{ textAlign: 'center', marginBottom: 14 }}>
                <img src={m.qr_image} alt="Scan to pay" className="qr-image" />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 6 }}>Scan with {m.name} app</p>
              </div>
            )}
            <p style={{ fontWeight: 700, marginBottom: 8 }}>{m.type === 'crypto' ? '₿ Send crypto to this address:' : (m.qr_image ? 'Or transfer to this account:' : '📋 Transfer to this account:')}</p>
            <p style={{ fontSize: '0.95rem', marginBottom: 4 }}><strong>{m.type === 'crypto' ? 'Wallet' : 'Account'}:</strong> {m.account_name}</p>
            <p style={{ fontSize: '0.95rem', marginBottom: 4 }}><strong>{m.type === 'crypto' ? 'Address' : 'Number'}:</strong> <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: 1 }}>{m.account_number}</span></p>
            {m.type === 'crypto' && m.network && (
              <p style={{ fontSize: '0.95rem', marginBottom: 4 }}><strong>Network:</strong> <span style={{ fontWeight: 700, color: '#7b1fa2' }}>{m.network}</span></p>
            )}
            {m.type === 'crypto' && m.network && (
              <p style={{ fontSize: '0.75rem', color: '#e65100', marginTop: 2, marginBottom: 4 }}>⚠️ Send only on <strong>{m.network}</strong> network. Using a different network may lose funds.</p>
            )}
            {m.type === 'crypto' && m.memo_tag && (
              <p style={{ fontSize: '0.95rem', marginBottom: 4 }}><strong>Destination Tag / Memo:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>{m.memo_tag}</span></p>
            )}
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 8 }}>After sending payment, proceed to place your order. Our team will verify your payment.</p>
          </div>
        ) : null
      })()}

      {paymongoError && (
        <div style={{ background: '#ffebee', borderRadius: 12, padding: 16, marginTop: 12, color: '#c62828' }}>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>⚠️ Payment Error</p>
          <p style={{ fontSize: '0.85rem' }}>{paymongoError}</p>
        </div>
      )}
    </section>
  )

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>

      {step === 'review' && (
        <>
          <section className="checkout-section">
            <h2>Order Type</h2>
            <div className="payment-options">
              <label className={`payment-option ${orderType === 'dine-in' ? 'selected' : ''}`}>
                <input type="radio" name="orderType" value="dine-in" checked={orderType === 'dine-in'} onChange={() => setOrderType('dine-in')} />
                🍽️ Dine In
              </label>
              <label className={`payment-option ${orderType === 'takeout' ? 'selected' : ''}`}>
                <input type="radio" name="orderType" value="takeout" checked={orderType === 'takeout'} onChange={() => setOrderType('takeout')} />
                🥡 Takeout / Delivery
              </label>
            </div>
          </section>

          <section className="checkout-section">
            <h2>{orderType === 'dine-in' ? 'Table' : 'Delivery Details'}</h2>
            {orderType === 'dine-in' ? (
              <div className="form-group">
                <label>Table Number (optional)</label>
                <input type="text" value={tableNumber} onChange={e => setTableNumber(e.target.value)} placeholder="e.g. 12" />
              </div>
            ) : (
              <div className="form-group">
                <label>Delivery Address</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)} />
              </div>
            )}
            <div className="form-group">
              <label>Order Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special requests?" rows={3} />
            </div>
          </section>

          {!user && (
            <section className="checkout-section">
              <h2>Your Information</h2>
              <div className="form-group">
                <label>Name <span style={{ color: '#e65100' }}>*</span></label>
                <input type="text" value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="e.g. Juan Dela Cruz" />
              </div>
              <div className="form-group">
                <label>Phone <span style={{ color: '#e65100' }}>*</span></label>
                <input type="tel" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} placeholder="e.g. 0917 123 4567" />
              </div>
            </section>
          )}

          <section className="checkout-section">
            <h2>Order Summary</h2>
            <div className="checkout-items">
              {items.map(item => (
                <div key={item.id} className="checkout-item">
                  <span>{item.name} x{item.quantity}</span>
                  <span>₱{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="checkout-total">
              <strong>Total</strong>
              <strong>₱{total}</strong>
            </div>
          </section>

          {renderPaymentSection()}

          <button className="btn btn-primary btn-block btn-lg" onClick={handlePay} disabled={paymongoLoading}>
            {paymongoLoading ? 'Connecting to PayMongo...' : payment === 'cash' ? 'Place Order' : isPaymongoMethod() ? `Pay ₱${total} via ${PAYMONGO_METHODS[getPaymongoType()]?.label}` : `Place Order (₱${total})`}
          </button>
        </>
      )}

      {step === 'processing' && (
        <div className="payment-processing">
          <div className="spinner"></div>
          <h2>Processing Payment...</h2>
          <p>{paymentMessage || 'Please wait while we process your payment'}</p>
        </div>
      )}

      {step === 'success' && (
        <div className="payment-success">
          <span className="success-icon">✅</span>
          <h2>{user ? 'Payment Successful!' : 'Order Placed!'}</h2>
          <p>{paymentMessage}</p>
          {user ? (
            <Link to="/orders" className="btn btn-primary btn-lg">View My Orders</Link>
          ) : (
            <Link to="/menu" className="btn btn-primary btn-lg">Back to Menu</Link>
          )}
        </div>
      )}
    </div>
  )
}