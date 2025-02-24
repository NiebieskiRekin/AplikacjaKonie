import { useState } from 'react'
import PWABadge from './PWABadge.tsx'
import './index.css'

function App() {
  return (
    <>
      <h1 className="text-3xl font-bold underline">    Hello world!  </h1>
      <PWABadge />
    </>
  )
}

export default App
