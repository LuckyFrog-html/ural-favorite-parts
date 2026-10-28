import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { fetchGoods, mapBrands, mapOffers } from '../api/favorit'

export const MIN_QUERY_LENGTH = 3

let latestOffersPromise = null

export const searchBrands = createAsyncThunk(
  'parts/searchBrands',
  async (number, { rejectWithValue, signal }) => {
    try {
      const goods = await fetchGoods({ number, signal })
      return mapBrands(goods)
    } catch (error) {
      if (error.name === 'AbortError') throw error
      return rejectWithValue(error.message || 'Не удалось получить производителей')
    }
  },
)

export const fetchOffers = createAsyncThunk(
  'parts/fetchOffers',
  async ({ number, brand }, { rejectWithValue, signal }) => {
    try {
      const goods = await fetchGoods({ number, brand, analogues: true, signal })
      return mapOffers(goods)
    } catch (error) {
      if (error.name === 'AbortError') throw error
      return rejectWithValue(error.message || 'Не удалось получить предложения')
    }
  },
)

export function requestOffers(arg) {
  return (dispatch) => {
    latestOffersPromise?.abort()
    latestOffersPromise = dispatch(fetchOffers(arg))
  }
}

export function abortActiveOffers() {
  latestOffersPromise?.abort()
  latestOffersPromise = null
}

const initialState = {
  number: '',
  brands: [],
  brandsStatus: 'idle',
  brandsError: null,
  brandsRequestId: null,
  selectedId: null,
  selectedBrand: null,
  offers: [],
  offersStatus: 'idle',
  offersError: null,
  offersRequestId: null,
}

const partsSlice = createSlice({
  name: 'parts',
  initialState,
  reducers: {
    setNumber(state, action) {
      const number = action.payload
      state.number = number
      state.brands = []
      state.brandsStatus = number.trim().length >= MIN_QUERY_LENGTH ? 'loading' : 'idle'
      state.brandsError = null
      state.brandsRequestId = null
      state.selectedId = null
      state.selectedBrand = null
      state.offers = []
      state.offersStatus = 'idle'
      state.offersError = null
      state.offersRequestId = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchBrands.pending, (state, action) => {
        state.brandsRequestId = action.meta.requestId
        state.brandsStatus = 'loading'
        state.brandsError = null
        state.brands = []
        state.selectedId = null
        state.selectedBrand = null
        state.offers = []
        state.offersStatus = 'idle'
        state.offersError = null
        state.offersRequestId = null
      })
      .addCase(searchBrands.fulfilled, (state, action) => {
        if (state.brandsRequestId !== action.meta.requestId) return
        if (action.meta.arg !== state.number.trim()) return
        state.brandsStatus = 'succeeded'
        state.brands = action.payload
      })
      .addCase(searchBrands.rejected, (state, action) => {
        if (state.brandsRequestId !== action.meta.requestId) return
        if (action.meta.aborted) return
        state.brandsStatus = 'failed'
        state.brandsError = action.payload || 'Не удалось получить производителей'
      })
      .addCase(fetchOffers.pending, (state, action) => {
        state.offersRequestId = action.meta.requestId
        state.selectedId = action.meta.arg.id
        state.selectedBrand = action.meta.arg.brand
        state.offersStatus = 'loading'
        state.offersError = null
        state.offers = []
      })
      .addCase(fetchOffers.fulfilled, (state, action) => {
        if (state.offersRequestId !== action.meta.requestId) return
        state.offersStatus = 'succeeded'
        state.offers = action.payload
      })
      .addCase(fetchOffers.rejected, (state, action) => {
        if (state.offersRequestId !== action.meta.requestId) return
        if (action.meta.aborted) return
        state.offersStatus = 'failed'
        state.offersError = action.payload || 'Не удалось получить предложения'
      })
  },
})

export const { setNumber } = partsSlice.actions
export default partsSlice.reducer
