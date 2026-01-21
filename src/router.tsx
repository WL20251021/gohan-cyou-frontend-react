import { createBrowserRouter, replace } from 'react-router'
import Layout from './layout'
import Home from './features/home'
// budget
import Store from './features/budget/store'
import Category from './features/budget/category'
import Goods from './features/budget/goods'
import Purchasement from './features/budget/purchasement'
import Consumption from './features/budget/consumption'
import Brand from './features/budget/brand'
import Login from './features/user/Login'
import Register from './features/user/Register'
import Profile from './features/user/Profile'
import Recipe from './features/recipe'
import Income from './features/budget/income'
import Inventory from './features/budget/inventory'
// budgetBook
import BudgetSummary from './features/budget/summary'
import DailyBudget from './features/budget/daily'
import Today from './features/budget/summary/today'
import Weekly from './features/budget/summary/weekly'
import Monthly from './features/budget/summary/monthly'

const router = createBrowserRouter([
  {
    path: '/login',
    Component: Login,
  },
  {
    path: '/register',
    Component: Register,
  },
  {
    Component: Layout,
    children: [
      {
        index: true,
        Component: Home,
      },
      {
        path: '/profile',
        Component: Profile,
      },
      {
        path: '/recipe',
        Component: Recipe,
      },
      {
        path: '/budget',
        children: [
          {
            path: 'consumption',
            Component: Consumption,
          },
          {
            path: 'purchasement',
            Component: Purchasement,
          },
          {
            path: 'income',
            Component: Income,
          },
          {
            path: 'goods',
            Component: Goods,
          },
          {
            path: 'store',
            Component: Store,
          },
          {
            path: 'category',
            Component: Category,
          },
          {
            path: 'brand',
            Component: Brand,
          },
          {
            path: 'inventory',
            Component: Inventory,
          },
          {
            path: 'summary',
            children: [
              {
                index: true,
                Component: BudgetSummary,
              },
              {
                path: 'daily',
                Component: DailyBudget,
              },
              {
                path: 'today',
                Component: Today,
              },
              {
                path: 'weekly',
                Component: Weekly,
              },
              {
                path: 'monthly',
                Component: Monthly,
              },
            ],
          },
        ],
      },
    ],
  },
])

export default router
