import { createBrowserRouter } from 'react-router'
import Layout from './layout'
import Home from './features/home'
// 家計簿関連管理ページ
import Store from './features/budget/store'
import Category from './features/budget/category'
import Goods from './features/budget/goods'
import Purchasement from './features/budget/purchasement'
import Consumption from './features/budget/consumption'
import Brand from './features/budget/brand'
import Login from './features/user/Login'
import Register from './features/user/Register'
import Profile from './features/user/Profile'
import Recipe from './features/recipe/recipe'
import Income from './features/budget/income'
// レシピ
import Inventory from './features/budget/inventory'
import Cook from './features/recipe/cook'
// 家計簿集計
import BudgetSummary from './features/budget/summary'
import DailyBudget from './features/budget/summary/daily'
import CreateDataPage from './features/createData'

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
    path: '/create-data',
    Component: CreateDataPage,
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
        children: [
          {
            index: true,
            Component: Recipe,
          },
          {
            path: 'cook',
            Component: Cook,
          },
        ],
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
                Component: DailyBudget,
              },
              {
                path: ':range',
                Component: BudgetSummary,
              },
            ],
          },
        ],
      },
    ],
  },
])

export default router
