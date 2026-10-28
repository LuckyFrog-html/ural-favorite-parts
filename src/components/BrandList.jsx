import { useDispatch, useSelector } from 'react-redux'
import Loader from './Loader'
import { requestOffers } from '../store/partsSlice'

export default function BrandList() {
  const dispatch = useDispatch()
  const number = useSelector((state) => state.parts.number)
  const brands = useSelector((state) => state.parts.brands)
  const brandsStatus = useSelector((state) => state.parts.brandsStatus)
  const brandsError = useSelector((state) => state.parts.brandsError)
  const selectedId = useSelector((state) => state.parts.selectedId)

  if (brandsStatus === 'idle') return null

  return (
    <section className="card shadow-sm mt-4">
      <div className="card-body">
        <h2 className="h5 mb-3">Производители</h2>

        {brandsStatus === 'loading' && <Loader text="Ищем производителей…" />}

        {brandsStatus === 'failed' && (
          <div className="alert alert-danger mb-0" role="alert">
            {brandsError}
          </div>
        )}

        {brandsStatus === 'succeeded' && brands.length === 0 && (
          <div className="alert alert-warning mb-0" role="status">
            По артикулу "{number.trim()}" ничего не найдено.
          </div>
        )}

        {brandsStatus === 'succeeded' && brands.length > 0 && (
          <div className="list-group brand-scroll">
            {brands.map((item) => {
              const selected = item.id === selectedId

              return (
                <button
                  key={item.id}
                  type="button"
                  className={`list-group-item list-group-item-action d-flex justify-content-between align-items-start gap-3 ${selected ? 'active' : ''}`}
                  aria-pressed={selected}
                  onClick={() =>
                    dispatch(
                      requestOffers({
                        number: number.trim(),
                        brand: item.brand,
                        id: item.id,
                      }),
                    )
                  }
                >
                  <span className="text-start">
                    <span className="d-block fw-semibold">{item.brand}</span>
                    <span className={`d-block small ${selected ? '' : 'text-secondary'}`}>
                      {item.name}
                      {item.number ? ` · ${item.number}` : ''}
                    </span>
                  </span>
                  <span className={`badge rounded-pill ${selected ? 'text-bg-light' : 'text-bg-secondary'}`}>
                    {item.count} шт.
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
