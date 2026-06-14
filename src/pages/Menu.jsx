import { useState } from 'react'
import { getMenuByCategory } from '../data/menu'
import MenuItemCard from '../components/MenuItemCard'

export default function Menu() {
  const [activeCat, setActiveCat] = useState('All')
  const categorized = getMenuByCategory()

  const filtered = activeCat === 'All'
    ? categorized.flatMap(c => c.items)
    : categorized.find(c => c.category === activeCat)?.items || []

  return (
    <div className="menu-page">
      <h1>Our Menu</h1>
      <div className="category-tabs">
        <button
          className={`cat-tab ${activeCat === 'All' ? 'active' : ''}`}
          onClick={() => setActiveCat('All')}
        >All</button>
        {categorized.map(({ category }) => (
          <button
            key={category}
            className={`cat-tab ${activeCat === category ? 'active' : ''}`}
            onClick={() => setActiveCat(category)}
          >{category}</button>
        ))}
      </div>
      <div className="menu-grid">
        {filtered.map(item => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
