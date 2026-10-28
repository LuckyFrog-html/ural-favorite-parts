import { useLayoutEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { useVirtualizer } from '@tanstack/react-virtual'
import Loader from './Loader'

const priceFormat = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 2,
})

const stockFormat = new Intl.NumberFormat('ru-RU')
const VIRTUALIZE_AFTER = 20
const COLUMN_COUNT = 5

function formatPrice(price) {
  if (price == null) return '—'
  return priceFormat.format(price)
}

function OffersColumns() {
  return (
    <colgroup>
      <col className="offers-col-name" />
      <col className="offers-col-number" />
      <col className="offers-col-warehouse" />
      <col className="offers-col-price" />
      <col className="offers-col-stock" />
    </colgroup>
  )
}

function OffersHead({ headRef }) {
  return (
    <thead ref={headRef}>
      <tr>
        <th scope="col">Название / производитель</th>
        <th scope="col">Артикул</th>
        <th scope="col">Склад</th>
        <th scope="col">Цена</th>
        <th scope="col">Остаток</th>
      </tr>
    </thead>
  )
}

function OfferRow({ row, measureRef, index }) {
  return (
    <tr ref={measureRef} data-index={index}>
      <td>
        <div className="fw-semibold">{row.name}</div>
        <div className="small text-secondary">
          {row.brand}
          <span className={`badge ms-2 ${row.kind === 'Искомая' ? 'text-bg-primary' : 'text-bg-light border'}`}>
            {row.kind}
          </span>
        </div>
      </td>
      <td>{row.number}</td>
      <td>{row.warehouse}</td>
      <td className="text-nowrap">{formatPrice(row.price)}</td>
      <td className={row.stock > 0 ? 'fw-semibold' : 'text-secondary'}>
        {stockFormat.format(row.stock)}
      </td>
    </tr>
  )
}

function SpacerRow({ height }) {
  if (height <= 0) return null

  return (
    <tr className="offers-spacer" aria-hidden="true">
      <td colSpan={COLUMN_COUNT} style={{ height, padding: 0, border: 0 }} />
    </tr>
  )
}

function PlainOffersTable({ offers }) {
  return (
    <div className="table-responsive offers-scroll">
      <table className="table table-hover align-middle mb-0 offers-table">
        <OffersColumns />
        <OffersHead />
        <tbody>
          {offers.map((row) => (
            <OfferRow key={row.id} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function VirtualOffersTable({ offers }) {
  const parentRef = useRef(null)
  const headRef = useRef(null)
  const [scrollMargin, setScrollMargin] = useState(0)

  useLayoutEffect(() => {
    const height = headRef.current?.offsetHeight ?? 0
    setScrollMargin((current) => (current === height ? current : height))
  }, [])

  // TanStack Virtual returns methods the compiler must not cache.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: offers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 68,
    overscan: 8,
    scrollMargin,
    getItemKey: (index) => offers[index].id,
  })

  const virtualRows = virtualizer.getVirtualItems()
  const paddingTop = virtualRows.length > 0 ? Math.max(0, virtualRows[0].start - scrollMargin) : 0
  const paddingBottom = virtualRows.length > 0
    ? Math.max(0, virtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end)
    : 0

  return (
    <div ref={parentRef} className="table-responsive offers-scroll">
      <table className="table table-hover align-middle mb-0 offers-table">
        <OffersColumns />
        <OffersHead headRef={headRef} />
        <tbody>
          <SpacerRow height={paddingTop} />
          {virtualRows.map((virtualRow) => (
            <OfferRow
              key={virtualRow.key}
              row={offers[virtualRow.index]}
              index={virtualRow.index}
              measureRef={virtualizer.measureElement}
            />
          ))}
          <SpacerRow height={paddingBottom} />
        </tbody>
      </table>
    </div>
  )
}

export default function OffersTable() {
  const offers = useSelector((state) => state.parts.offers)
  const offersStatus = useSelector((state) => state.parts.offersStatus)
  const offersError = useSelector((state) => state.parts.offersError)
  const selectedBrand = useSelector((state) => state.parts.selectedBrand)
  const number = useSelector((state) => state.parts.number)

  if (offersStatus === 'idle') return null

  const inStock = offers.filter((row) => row.stock > 0).length
  const virtualize = offers.length > VIRTUALIZE_AFTER

  return (
    <section className="card shadow-sm mb-4 mt-4">
      <div className="card-body">
        <h2 className="h5 mb-1">Аналоги и предложения</h2>
        <p className="text-secondary mb-3">
          {selectedBrand} · {number.trim()}
        </p>

        {offersStatus === 'loading' && <Loader text="Загружаем аналоги и предложения…" />}

        {offersStatus === 'failed' && (
          <div className="alert alert-danger mb-0" role="alert">
            {offersError}
          </div>
        )}

        {offersStatus === 'succeeded' && offers.length === 0 && (
          <div className="alert alert-warning mb-0" role="status">
            Аналоги и предложения не найдены.
          </div>
        )}

        {offersStatus === 'succeeded' && offers.length > 0 && (
          <>
            <p className="small text-secondary">
              Предложений: {stockFormat.format(offers.length)}, в наличии: {stockFormat.format(inStock)}
            </p>
            {virtualize ? (
              <VirtualOffersTable key={`${number.trim()}-${selectedBrand}`} offers={offers} />
            ) : (
              <PlainOffersTable offers={offers} />
            )}
          </>
        )}
      </div>
    </section>
  )
}
