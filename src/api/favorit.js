const API_URL = import.meta.env.VITE_FAVORIT_API_URL
const API_KEY = import.meta.env.VITE_FAVORIT_API_KEY

const ERROR_TEXT = {
  'Empty key!': 'Не указан ключ покупателя',
  'Invalid key client!': 'Неверный ключ покупателя',
  'Empty number goods!': 'Не указан номер детали',
  'Request quota exceeded!': 'Превышен лимит запросов. Попробуйте ещё раз чуть позже.',
}

function isRealGood(good) {
  if (!good) return false
  return Boolean(String(good.brand || '').trim() || String(good.number || '').trim())
}

function buildUrl({ number, brand, analogues }) {
  const params = [
    `key=${encodeURIComponent(API_KEY)}`,
    `number=${encodeURIComponent(number)}`,
  ]

  if (brand) params.push(`brand=${encodeURIComponent(brand)}`)
  if (analogues) params.push('analogues=on')

  return `${API_URL}?${params.join('&')}`
}

export async function fetchGoods({ number, brand, analogues = false, signal }) {
  if (!API_KEY) {
    throw new Error('Не задан ключ покупателя. Добавьте VITE_FAVORIT_API_KEY в файл .env')
  }

  let response

  try {
    response = await fetch(buildUrl({ number, brand, analogues }), { signal })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error('Нет соединения с сервером. Проверьте сеть и повторите попытку.', { cause: error })
  }

  if (!response.ok) {
    throw new Error(`Сервер ответил с ошибкой ${response.status}`)
  }

  let data
  try {
    data = await response.json()
  } catch {
    throw new Error('Не удалось разобрать ответ сервера')
  }

  if (data?.error) {
    throw new Error(ERROR_TEXT[data.error] || data.error)
  }

  if (!Array.isArray(data?.goods)) {
    throw new Error('Сервер вернул пустой ответ')
  }

  return data.goods
}

export function mapBrands(goods) {
  return goods.filter(isRealGood).map((good, index) => ({
    id: `${good.goodsID || 'good'}-${index}`,
    brand: good.brand,
    name: good.name || 'Без названия',
    number: good.number,
    count: Number(good.count) || 0,
  }))
}

function rowsFromItem(good, kind) {
  const warehouses = Array.isArray(good.warehouses) ? good.warehouses : []

  if (warehouses.length === 0) {
    return [
      {
        id: `${kind}-${good.goodsID || good.number}-empty`,
        kind,
        name: good.name || 'Без названия',
        brand: good.brand || '—',
        number: good.number || '—',
        warehouse: '—',
        price: null,
        stock: 0,
      },
    ]
  }

  return warehouses.map((warehouse, index) => ({
    id: `${kind}-${good.goodsID || good.number}-${warehouse.id || index}`,
    kind,
    name: good.name || 'Без названия',
    brand: good.brand || '—',
    number: good.number || '—',
    warehouse: warehouse.code || 'Склад',
    price: Number(warehouse.price) || 0,
    stock: Number(warehouse.stock) || 0,
  }))
}

export function mapOffers(goods) {
  const rows = []

  const pushRows = (good, kind) => {
    rowsFromItem(good, kind).forEach((row) => {
      rows.push({ ...row, id: `${rows.length}-${row.id}` })
    })
  }

  goods.filter(isRealGood).forEach((good) => {
    pushRows(good, 'Искомая')

    const analogues = Array.isArray(good.analogues) ? good.analogues : []
    analogues.filter(isRealGood).forEach((analog) => {
      pushRows(analog, 'Аналог')
    })
  })

  rows.sort((a, b) => {
    const byStock = (a.stock > 0 ? 0 : 1) - (b.stock > 0 ? 0 : 1)
    if (byStock) return byStock

    const byKind = (a.kind === 'Искомая' ? 0 : 1) - (b.kind === 'Искомая' ? 0 : 1)
    if (byKind) return byKind

    const aPrice = a.price == null ? Number.POSITIVE_INFINITY : a.price
    const bPrice = b.price == null ? Number.POSITIVE_INFINITY : b.price
    return aPrice - bPrice
  })

  return rows
}
