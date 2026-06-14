const menuItems = [
  { id: 1, name: 'Margherita Pizza', description: 'Classic tomato, mozzarella, basil', price: 299, category: 'Pizza', image: 'https://placehold.co/200x200/ff6b6b/fff?text=Pizza' },
  { id: 2, name: 'Pepperoni Pizza', description: 'Pepperoni, mozzarella, tomato sauce', price: 349, category: 'Pizza', image: 'https://placehold.co/200x200/ff6b6b/fff?text=Pizza' },
  { id: 3, name: 'BBQ Chicken Pizza', description: 'Grilled chicken, BBQ sauce, red onion', price: 399, category: 'Pizza', image: 'https://placehold.co/200x200/ff6b6b/fff?text=Pizza' },
  { id: 4, name: 'Cheeseburger', description: 'Angus beef, cheddar, lettuce, tomato', price: 199, category: 'Burgers', image: 'https://placehold.co/200x200/ffa726/fff?text=Burger' },
  { id: 5, name: 'Bacon Burger', description: 'Beef patty, bacon, smoked gouda', price: 249, category: 'Burgers', image: 'https://placehold.co/200x200/ffa726/fff?text=Burger' },
  { id: 6, name: 'Veggie Burger', description: 'Black bean patty, avocado, sprouts', price: 179, category: 'Burgers', image: 'https://placehold.co/200x200/ffa726/fff?text=Burger' },
  { id: 7, name: 'Caesar Salad', description: 'Romaine, parmesan, croutons, Caesar dressing', price: 179, category: 'Salads', image: 'https://placehold.co/200x200/81c784/fff?text=Salad' },
  { id: 8, name: 'Greek Salad', description: 'Feta, olives, cucumber, tomato, oregano', price: 199, category: 'Salads', image: 'https://placehold.co/200x200/81c784/fff?text=Salad' },
  { id: 9, name: 'Spaghetti Bolognese', description: 'Pasta with rich meat sauce', price: 259, category: 'Pasta', image: 'https://placehold.co/200x200/fdd835/333?text=Pasta' },
  { id: 10, name: 'Fettuccine Alfredo', description: 'Creamy parmesan sauce with pasta', price: 239, category: 'Pasta', image: 'https://placehold.co/200x200/fdd835/333?text=Pasta' },
  { id: 11, name: 'Chicken Tikka Masala', description: 'Spiced curry with cream, basmati rice', price: 299, category: 'Curry', image: 'https://placehold.co/200x200/ff8a65/fff?text=Curry' },
  { id: 12, name: 'Pad Thai', description: 'Rice noodles, shrimp, peanuts, tamarind', price: 259, category: 'Noodles', image: 'https://placehold.co/200x200/a1887f/fff?text=Noodles' },
  { id: 13, name: 'French Fries', description: 'Crispy golden fries with sea salt', price: 99, category: 'Sides', image: 'https://placehold.co/200x200/ffcc02/333?text=Fries' },
  { id: 14, name: 'Onion Rings', description: 'Beer-battered, served with ranch', price: 119, category: 'Sides', image: 'https://placehold.co/200x200/ffcc02/333?text=Rings' },
  { id: 15, name: 'Chocolate Lava Cake', description: 'Warm chocolate cake with molten center', price: 159, category: 'Desserts', image: 'https://placehold.co/200x200/795548/fff?text=Cake' },
  { id: 16, name: 'Tiramisu', description: 'Coffee-soaked ladyfingers, mascarpone', price: 139, category: 'Desserts', image: 'https://placehold.co/200x200/795548/fff?text=Cake' },
  { id: 17, name: 'Coca-Cola', description: 'Ice-cold Coca-Cola', price: 55, category: 'Beverages', image: 'https://placehold.co/200x200/ef5350/fff?text=Cola' },
  { id: 18, name: 'Lemonade', description: 'Fresh squeezed lemonade', price: 75, category: 'Beverages', image: 'https://placehold.co/200x200/fdd835/333?text=Drink' },
  { id: 19, name: 'Iced Tea', description: 'Southern-style sweet tea', price: 65, category: 'Beverages', image: 'https://placehold.co/200x200/fdd835/333?text=Drink' },
  { id: 20, name: 'Water Bottle', description: 'Bottled mineral water', price: 35, category: 'Beverages', image: 'https://placehold.co/200x200/90caf9/fff?text=Water' },
  { id: 21, name: 'Mango Shake', description: 'Fresh mango blended with milk', price: 99, category: 'Beverages', image: 'https://placehold.co/200x200/ffb74d/fff?text=Shake' },
  { id: 22, name: 'Buko Juice', description: 'Chilled young coconut juice', price: 69, category: 'Beverages', image: 'https://placehold.co/200x200/a5d6a7/333?text=Juice' },
  { id: 23, name: 'Cappuccino', description: 'Espresso with steamed milk foam', price: 89, category: 'Beverages', image: 'https://placehold.co/200x200/8d6e63/fff?text=Coffee' },
  { id: 24, name: 'Hot Chocolate', description: 'Rich Belgian hot chocolate', price: 85, category: 'Beverages', image: 'https://placehold.co/200x200/8d6e63/fff?text=Coffee' },
]

export const categories = [...new Set(menuItems.map(i => i.category))]

export function getMenuByCategory() {
  return categories.map(cat => ({
    category: cat,
    items: menuItems.filter(i => i.category === cat)
  }))
}

export function getMenuItem(id) {
  return menuItems.find(i => i.id === Number(id))
}

export default menuItems
