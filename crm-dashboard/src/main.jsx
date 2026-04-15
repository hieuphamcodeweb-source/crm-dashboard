import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App as AntdApp } from 'antd'
import { BrowserRouter } from 'react-router-dom'
import 'antd/dist/reset.css'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './client/context/AuthContext'
import { CartProvider } from './client/context/CartContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AntdApp>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </AntdApp>
  </StrictMode>,
)
