# Restaurant Order Taking App

A mobile app for restaurant order management with three roles: **Admin**, **Cook**, and **Consumer**.

## Features

### Consumer
- Browse menu with category filtering
- On-site (table) or off-site ordering
- Cart management with quantity control
- Real-time order status tracking

### Cook
- View incoming orders separated by status (Pending / Preparing)
- Mark individual items as done
- Orders auto-refresh every 10 seconds
- Order automatically moves to "Ready" when all items are done

### Admin
- Dashboard with summary stats (total orders, revenue, pending/preparing/ready counts)
- Menu management (add, edit, toggle availability, delete)
- Sales reports with category-wise breakdown
- Full order management with status progression

## Tech Stack
- **Backend:** Node.js + Express (REST API with JSON file storage)
- **Frontend:** React Native (Expo) with React Navigation

## Quick Start

### Prerequisites
- Node.js 18+
- npm

### 1. Start Backend Server
```bash
cd backend
npm install   # already done
node server.js
```
API runs on `http://localhost:3000`

### 2. Start Mobile App
```bash
cd mobile
npm install              # already done
npx expo start           # opens Expo dev tools
npx expo start --web     # if you want to run in browser
```

### 3. Update API URL (important)
Edit `mobile/src/services/api.js` and change `API_URL` to your computer's local IP:
```js
const API_URL = 'http://192.168.1.100:3000/api';  // <- change this
```

## Demo Accounts
| Role     | Email                     | Password  |
|----------|---------------------------|-----------|
| Admin    | admin@restaurant.com      | admin123  |
| Cook     | cook@restaurant.com       | cook123   |
| Consumer | john@example.com          | pass123   |
| Consumer | jane@example.com          | pass123   |

## Project Structure
```
restaurant-app/
  backend/
    server.js        # Express API server
    data/db.json     # JSON file database
  mobile/
    App.js           # Entry point
    src/
      context/       # AuthContext, CartContext
      navigation/    # AppNavigator (role-based routing)
      screens/       # All screens by role
        LoginScreen.js
        Consumer/    # Menu, Cart, OrderStatus
        Cook/        # Kitchen
        Admin/       # Dashboard, MenuMgmt, Sales, Orders
      components/    # MenuItemCard, OrderCard
      services/api.js # API client
```

## API Endpoints
- `POST /api/login` - Login
- `GET /api/menu` - Available menu
- `POST /api/orders` - Create order
- `GET /api/orders?role=cook` - Kitchen orders
- `PUT /api/orders/:id/items/:itemId/done` - Mark item done
- `GET /api/admin/summary` - Dashboard summary
- `GET /api/admin/sales` - Sales report
