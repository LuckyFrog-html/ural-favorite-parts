import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { MIN_QUERY_LENGTH, abortActiveOffers, searchBrands, setNumber } from '../store/partsSlice'

export default function SearchForm() {
  const dispatch = useDispatch()
  const number = useSelector((state) => state.parts.number)

  useEffect(() => {
    const query = number.trim()

    if (query.length < MIN_QUERY_LENGTH) {
      abortActiveOffers()
      return undefined
    }

    let promise
    const timer = setTimeout(() => {
      promise = dispatch(searchBrands(query))
    }, 400)

    return () => {
      clearTimeout(timer)
      promise?.abort()
      abortActiveOffers()
    }
  }, [number, dispatch])

  const queryLength = number.trim().length
  
  let hint = ''

  if (queryLength > 0 && queryLength < MIN_QUERY_LENGTH) {
    hint = `Для поиска нужно минимум ${MIN_QUERY_LENGTH} символа.`
  }

  return (
    <div className="search-sticky">
      <form
        className="card shadow-sm"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="card-body">
          <label htmlFor="part-number" className="form-label fw-semibold">
            Артикул детали
          </label>
          <input
            id="part-number"
            className="form-control form-control-lg"
            value={number}
            placeholder="Например, 01089"
            autoComplete="off"
            inputMode="search"
            onChange={(event) => dispatch(setNumber(event.target.value))}
          />
          <div className="form-text">{hint}</div>
        </div>
      </form>
    </div>
  )
}
