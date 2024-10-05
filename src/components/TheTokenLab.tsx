'use client'

import React from "react"
import { Header } from "./Header"
import { MainContent } from "./MainContent"
import { Footer } from "./Footer"

export default function TokenCreator() {
  return (
    <div className="min-h-screen bg-[#121212] text-white p-8">
      <Header />
      <MainContent />
      <Footer />
    </div>
  )
}