import {BrowserRouter, Routes, Route} from 'react-router-dom'
import {Portfolio} from './pages/Portfolio'
import {News} from './pages/News'
import {BottomNav} from './components/common/BottomNav'
import './App.css'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Portfolio />} />
                <Route path="/news" element={<News />} />
            </Routes>
            <BottomNav />
        </BrowserRouter>
    )
}

export default App
