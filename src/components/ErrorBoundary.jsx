import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="empty-state">
          <span className="empty-icon">⚠️</span>
          <h2>Something went wrong</h2>
          <p style={{ color: '#f44336', fontSize: '0.8rem', marginBottom: 16 }}>
            {this.state.error.message}
          </p>
          <button className="btn btn-primary" onClick={() => { this.setState({ error: null }); window.location.hash = '#/' }}>
            Reload App
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
