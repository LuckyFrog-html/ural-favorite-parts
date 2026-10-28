export default function Loader({ text }) {
  return (
    <div className="d-flex align-items-center gap-2 text-secondary py-3" role="status">
      <div className="spinner-border spinner-border-sm" aria-hidden="true" />
      <span>{text}</span>
    </div>
  )
}
