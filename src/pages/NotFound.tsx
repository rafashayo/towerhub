import { Link } from 'react-router-dom'
import { RadarMark } from '../components/RadarMark'

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <RadarMark size={48} />
      <h1 className="mt-6 font-display text-5xl font-bold text-white">404</h1>
      <p className="mt-2 text-mist-400">Out of radar coverage. This page doesn't exist.</p>
      <Link to="/" className="btn-primary mt-6">
        Back to home
      </Link>
    </div>
  )
}
