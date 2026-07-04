import { BrowserRouter, Routes, Route } from 'react-router-dom'
import RequestForm from './pages/RequestForm'
import StatusCheck from './pages/StatusCheck'
import Admin from './pages/Admin'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RequestForm />} />
        <Route path="/status" element={<StatusCheck />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  )
}
