import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import Providers from './shell/Providers'
import App from './shell/App'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Insights from './pages/Insights'
import Highlights from './pages/Highlights'
import Classifier from './pages/Classifier'
import Batch from './pages/Batch'
import Ranking from './pages/Ranking'
import Reviews from './pages/Reviews'
import Reports from './pages/Reports'
import Profile from './pages/Profile'
import Register from './pages/Register'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import RouteError from './pages/RouteError'
import NotFound from './pages/NotFound'
import AuthSuccess from './pages/AuthSuccess'
import SubscriptionSuccess from './pages/SubscriptionSuccess'
import SubscriptionCancel from './pages/SubscriptionCancel'
import ChoosePlan from './pages/ChoosePlan'

const router = createBrowserRouter([
  { path: '/', element: <Landing/>, errorElement: <RouteError/> },
  { path: '/choose-plan', element: <ChoosePlan/>, errorElement: <RouteError/> },
  { path: '/register', element: <Register/>, errorElement: <RouteError/> },
  { path: '/login', element: <Login/>, errorElement: <RouteError/> },
  { path: '/forgot', element: <ForgotPassword/>, errorElement: <RouteError/> },
  { path: '/reset', element: <ResetPassword/>, errorElement: <RouteError/> },
  { path: '/reset-password', element: <ResetPassword/>, errorElement: <RouteError/> },
  { path: '/auth/success', element: <AuthSuccess/>, errorElement: <RouteError/> },
  { path: '/subscription/success', element: <SubscriptionSuccess/>, errorElement: <RouteError/> },
  { path: '/subscription/cancel', element: <SubscriptionCancel/>, errorElement: <RouteError/> },
  {
    path: '/app',
    element: <App/>,
    errorElement: <RouteError/>,
    children: [
      { index: true, element: <Dashboard/> },
      { path: 'insights', element: <Insights/> },
      { path: 'highlights', element: <Highlights/> },
      { path: 'classifier', element: <Classifier/> },
      { path: 'batch', element: <Batch/> },
      { path: 'ranking', element: <Ranking/> },
      { path: 'reviews', element: <Reviews/> },
      { path: 'reports', element: <Reports/> },
      { path: 'profile', element: <Profile/> },
      { path: '*', element: <NotFound/> }
    ]
  },
  { path: '*', element: <NotFound/> }
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Providers>
      <RouterProvider router={router}/>
    </Providers>
  </React.StrictMode>
)
