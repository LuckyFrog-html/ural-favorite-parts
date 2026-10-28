import SearchForm from './components/SearchForm'
import BrandList from './components/BrandList'
import OffersTable from './components/OffersTable'

export default function App() {
  return (
    <main className="container py-4 py-md-5">
      <header className="mb-4">
        <h1 className="h3 mb-1">Проценка автозапчастей</h1>
        <p className="text-secondary mb-0">
          Введите артикул, выберите производителя и посмотрите аналоги со складов.
        </p>
      </header>
      <SearchForm />
      <BrandList />
      <OffersTable />
    </main>
  )
}
