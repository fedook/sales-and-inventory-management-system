import { Route, Routes } from 'react-router-dom'
import GuestRoute from './components/GuestRoute'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './layouts/AppLayout'
import CustomersPage from './pages/CustomersPage'
import DashboardPage from './pages/DashboardPage'
import AnalyticsPage from './pages/AnalyticsPage'
import HomePage from './pages/HomePage'
import InventoryPage from './pages/InventoryPage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import ProductsPage from './pages/ProductsPage'
import RegisterPage from './pages/RegisterPage'
import SalesPage from './pages/SalesPage'
import SuppliersPage from './pages/SuppliersPage'
import UsersPage from './pages/UsersPage'

/**
 * Route map
 *
 * Public:      /, /login, /register
 * Signed in:   /dashboard, /products, /sales, /inventory,
 *              /customers, /suppliers
 * Admin only:  /users, /analytics
 *
 */
function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />

          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/users" element={<UsersPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
