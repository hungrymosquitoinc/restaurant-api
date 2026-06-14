import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import menuItems from '../data/menu'

const popular = menuItems.slice(0, 4)

export default function Home() {
  const { user } = useAuth()
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-bg-pattern" />
        <div className="hero-content">
          <span className="hero-badge">Now Serving</span>
          <h1>Great Food,<br />No Waiting.</h1>
          <p>Order your favorite dishes from Zpectrum Restobar and enjoy a seamless dining experience.</p>
          <Link to="/menu" className="hero-cta">
            <span>Browse Our Menu</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </Link>
        </div>
        <div className="hero-stats">
          <div className="hero-stat"><span className="hero-stat-value">120+</span><span className="hero-stat-label">Menu Items</span></div>
          <div className="hero-stat"><span className="hero-stat-value">2k+</span><span className="hero-stat-label">Happy Customers</span></div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>Popular Dishes</h2>
          <Link to="/menu" className="section-link">View All</Link>
        </div>
        <div className="popular-grid">
          {popular.map(item => (
            <Link to="/menu" key={item.id} className="popular-card">
              <div className="popular-img">
                <img src={item.image} alt={item.name} loading="lazy" />
              </div>
              <div className="popular-info">
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <span className="popular-price">₱{item.price}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section how-section">
        <div className="section-header">
          <h2>How It Works</h2>
        </div>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-icon">📋</div>
            <h3>Browse Menu</h3>
            <p>Explore our wide selection of dishes crafted with the finest ingredients.</p>
          </div>
          <div className="step-connector" />
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-icon">🛒</div>
            <h3>Place Order</h3>
            <p>Add items to your cart and checkout in seconds with our easy ordering system.</p>
          </div>
          <div className="step-connector" />
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-icon">🍽️</div>
            <h3>Enjoy</h3>
            <p>Your order is prepared fresh and served hot. Track it in real-time!</p>
          </div>
        </div>
      </section>

      <section className="section features-section">
        <div className="section-header">
          <h2>Why Choose Us</h2>
        </div>
        <div className="features">
          <div className="feature-card">
            <div className="feature-icon-wrap">
              <span className="feature-icon">🌿</span>
            </div>
            <h3>Fresh Ingredients</h3>
            <p>We source only the freshest local and imported ingredients for every dish.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrap">
              <span className="feature-icon">⚡</span>
            </div>
            <h3>Lightning Fast</h3>
            <p>Real-time kitchen updates so you always know the status of your order.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrap">
              <span className="feature-icon">🔒</span>
            </div>
            <h3>Secure Payments</h3>
            <p>Multiple payment options with bank-grade security for peace of mind.</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Eat?</h2>
          <p>Join us today and experience the best dining experience in town.</p>
          <div className="cta-buttons">
            {user ? (
              <Link to="/menu" className="btn btn-primary btn-lg">Order Now</Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">Create Account</Link>
                <Link to="/login" className="btn btn-outline btn-lg">Sign In</Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
