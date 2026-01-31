import { useState } from 'react'
import {
  Row,
  Col,
  DatePicker,
  InputNumber,
  Button,
  Space,
  message,
  Progress,
  Card,
  Modal,
} from 'antd'
import dayjs from 'dayjs'
import { addBrand, getBrands, deleteBrands } from '../budget/brand/api'
import { addCategory, getCategories, deleteCategory } from '../budget/category/api'
import { addGoods, getGoods, deleteGoods } from '../budget/goods/api'
import { addStore, getStores, deleteStores } from '../budget/store/api'
import { addPurchasement, getPurchasements, deletePurchasement } from '../budget/purchasement/api'
import { addIncome, getIncomes, deleteIncome } from '../budget/income/api'
import { addConsumption, getConsumption, deleteConsumption } from '../budget/consumption/api'

const { RangePicker } = DatePicker

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomDateBetween(start: Date, end: Date) {
  const s = start.getTime()
  const e = end.getTime()
  const t = Math.floor(Math.random() * (e - s + 1)) + s
  return new Date(t)
}

export default function CreateDataPage() {
  const [range, setRange] = useState<[any, any] | null>([dayjs().subtract(30, 'day'), dayjs()])
  const [count, setCount] = useState<number>(10)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const runGenerator = async (module: string) => {
    if (!range) {
      message.warning('日付範囲を選択してください')
      return
    }
    setLoading(true)
    setProgress(0)
    const start = range[0].toDate()
    const end = range[1].toDate()

    try {
      for (let i = 0; i < count; i++) {
        const date = randomDateBetween(start, end)
        if (module === 'brand') {
          await addBrand({ brandName: `Brand ${Date.now()}-${i}` })
        } else if (module === 'category') {
          await addCategory({ categoryName: `Category ${Date.now()}-${i}` })
        } else if (module === 'goods') {
          await addGoods({ goodsName: `Goods ${Date.now()}-${i}` })
        } else if (module === 'store') {
          await addStore({ storeName: `Store ${Date.now()}-${i}` })
        } else if (module === 'income') {
          await addIncome({
            incomeDate: date,
            amount: randomInt(1000, 20000),
            category: 'OTHER',
            description: 'Generated',
          })
        } else if (module === 'purchasement') {
          const qty = randomInt(1, 10)
          const unit = randomInt(100, 2000)
          await addPurchasement({
            purchaseDate: date,
            quantity: qty,
            unitPrice: unit,
            totalPrice: qty * unit,
            goodsId: null,
            storeId: null,
          })
        } else if (module === 'consumption') {
          await addConsumption({
            consumptionDate: date,
            quantity: randomInt(1, 5),
            description: 'Generated',
            purchasementId: null,
          })
        } else if (module === 'all') {
          // create one of each type in sequence
          await addBrand({ brandName: `Brand ${Date.now()}-${i}` })
          await addCategory({ categoryName: `Category ${Date.now()}-${i}` })
          await addGoods({ goodsName: `Goods ${Date.now()}-${i}` })
          await addStore({ storeName: `Store ${Date.now()}-${i}` })
          await addIncome({
            incomeDate: date,
            amount: randomInt(1000, 20000),
            category: 'OTHER',
            description: 'Generated',
          })
          const qty = randomInt(1, 10)
          const unit = randomInt(100, 2000)
          await addPurchasement({
            purchaseDate: date,
            quantity: qty,
            unitPrice: unit,
            totalPrice: qty * unit,
            goodsId: null,
            storeId: null,
          })
          await addConsumption({
            consumptionDate: date,
            quantity: randomInt(1, 5),
            description: 'Generated',
            purchasementId: null,
          })
        }

        setProgress(Math.round(((i + 1) / count) * 100))
      }

      message.success(`${module} のデータ生成が完了しました (${count} 件)`)
    } catch (err) {
      console.error(err)
      message.error('データ生成中にエラーが発生しました')
    } finally {
      setLoading(false)
      setTimeout(() => setProgress(0), 800)
    }
  }

  const deleteAllData = () => {
    Modal.confirm({
      title: 'すべてのデータを削除しますか？',
      content: 'この操作は元に戻せません。すべてのテストデータを削除します。',
      okType: 'danger',
      onOk: async () => {
        setLoading(true)
        setProgress(0)
        const modules = [
          { name: 'brands', getter: getBrands, deleter: deleteBrands },
          { name: 'categories', getter: getCategories, deleter: deleteCategory },
          { name: 'goods', getter: getGoods, deleter: deleteGoods },
          { name: 'stores', getter: getStores, deleter: deleteStores },
          { name: 'incomes', getter: getIncomes, deleter: deleteIncome },
          { name: 'purchasements', getter: getPurchasements, deleter: deletePurchasement },
          { name: 'consumptions', getter: getConsumption, deleter: deleteConsumption },
        ]

        try {
          for (let i = 0; i < modules.length; i++) {
            const m = modules[i] as any
            try {
              const res = await m.getter()
              const items = res?.data || res || []
              const ids = items.map((it: any) => it.id).filter((id: any) => id != null)
              if (ids.length > 0) {
                await m.deleter(ids)
              }
            } catch (e) {
              console.error(`failed to clear ${m.name}`, e)
            }
            setProgress(Math.round(((i + 1) / modules.length) * 100))
          }

          message.success('すべてのデータを削除しました')
        } catch (err) {
          console.error(err)
          message.error('データ削除中にエラーが発生しました')
        } finally {
          setLoading(false)
          setTimeout(() => setProgress(0), 800)
        }
      },
    })
  }

  const deleteModule = (module: string) => {
    const labelMap: Record<string, string> = {
      brand: 'ブランド',
      category: 'カテゴリ',
      goods: '商品',
      store: '店舗',
      income: '収入',
      purchasement: '支出',
      consumption: '消費',
    }

    Modal.confirm({
      title: `${labelMap[module] || module} をすべて削除しますか？`,
      content: 'この操作は元に戻せません。注意してください。',
      okType: 'danger',
      onOk: async () => {
        setLoading(true)
        try {
          let res: any
          let ids: any[] = []
          switch (module) {
            case 'brand':
              res = await getBrands()
              ids = (res?.data || res || []).map((it: any) => it.id).filter((id: any) => id != null)
              if (ids.length) await deleteBrands(ids)
              break
            case 'category':
              res = await getCategories()
              ids = (res?.data || res || []).map((it: any) => it.id).filter((id: any) => id != null)
              if (ids.length) await deleteCategory(ids)
              break
            case 'goods':
              res = await getGoods()
              ids = (res?.data || res || []).map((it: any) => it.id).filter((id: any) => id != null)
              if (ids.length) await deleteGoods(ids)
              break
            case 'store':
              res = await getStores()
              ids = (res?.data || res || []).map((it: any) => it.id).filter((id: any) => id != null)
              if (ids.length) await deleteStores(ids)
              break
            case 'income':
              res = await getIncomes()
              ids = (res?.data || res || []).map((it: any) => it.id).filter((id: any) => id != null)
              if (ids.length) await deleteIncome(ids)
              break
            case 'purchasement':
              res = await getPurchasements()
              ids = (res?.data || res || []).map((it: any) => it.id).filter((id: any) => id != null)
              if (ids.length) await deletePurchasement(ids)
              break
            case 'consumption':
              res = await getConsumption()
              ids = (res?.data || res || []).map((it: any) => it.id).filter((id: any) => id != null)
              if (ids.length) await deleteConsumption(ids)
              break
            default:
              break
          }

          message.success(`${labelMap[module] || module} の削除が完了しました`)
        } catch (err) {
          console.error(err)
          message.error('削除中にエラーが発生しました')
        } finally {
          setLoading(false)
        }
      },
    })
  }

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 16 }}>テストデータ生成</h2>

      <Card style={{ marginBottom: 16 }}>
        <Row
          gutter={16}
          align="middle"
        >
          <Col>
            <span>日付範囲:</span>
          </Col>
          <Col>
            <RangePicker
              value={range as any}
              onChange={(v) => setRange(v as any)}
            />
          </Col>
          <Col>
            <span>件数:</span>
          </Col>
          <Col>
            <InputNumber
              min={1}
              max={1000}
              value={count}
              onChange={(v) => setCount(v || 1)}
            />
          </Col>
        </Row>
      </Card>

      <Space
        direction="vertical"
        style={{ width: '100%' }}
      >
        <Space wrap>
          <Button
            disabled={loading}
            onClick={() => runGenerator('brand')}
          >
            ブランド生成
          </Button>
          <Button
            danger
            disabled={loading}
            onClick={() => deleteModule('brand')}
          >
            ブランド削除
          </Button>
          <Button
            disabled={loading}
            onClick={() => runGenerator('category')}
          >
            カテゴリ生成
          </Button>
          <Button
            danger
            disabled={loading}
            onClick={() => deleteModule('category')}
          >
            カテゴリ削除
          </Button>
          <Button
            disabled={loading}
            onClick={() => runGenerator('goods')}
          >
            商品生成
          </Button>
          <Button
            danger
            disabled={loading}
            onClick={() => deleteModule('goods')}
          >
            商品削除
          </Button>
          <Button
            disabled={loading}
            onClick={() => runGenerator('store')}
          >
            店舗生成
          </Button>
          <Button
            danger
            disabled={loading}
            onClick={() => deleteModule('store')}
          >
            店舗削除
          </Button>
          <Button
            disabled={loading}
            onClick={() => runGenerator('income')}
          >
            収入生成
          </Button>
          <Button
            danger
            disabled={loading}
            onClick={() => deleteModule('income')}
          >
            収入削除
          </Button>
          <Button
            disabled={loading}
            onClick={() => runGenerator('purchasement')}
          >
            支出生成
          </Button>
          <Button
            danger
            disabled={loading}
            onClick={() => deleteModule('purchasement')}
          >
            支出削除
          </Button>
          <Button
            disabled={loading}
            onClick={() => runGenerator('consumption')}
          >
            消費生成
          </Button>
          <Button
            danger
            disabled={loading}
            onClick={() => deleteModule('consumption')}
          >
            消費削除
          </Button>
          <Button
            type="primary"
            disabled={loading}
            onClick={() => runGenerator('all')}
          >
            すべて生成
          </Button>
          <Button
            danger
            onClick={deleteAllData}
            disabled={loading}
          >
            すべて削除
          </Button>
        </Space>

        {loading && (
          <div style={{ marginTop: 8 }}>
            <Progress
              percent={progress}
              status={progress < 100 ? 'active' : 'normal'}
            />
          </div>
        )}
      </Space>
    </div>
  )
}
