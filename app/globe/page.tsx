"use client"

import dynamic from "next/dynamic"
import { useState } from "react"
import CountryModal from "@/components/CountryModal"
import useGlobeStore from "@/store/globe"

const GlobeCanvas = dynamic(() => import("@/components/GlobeCanvas"), { ssr: false })

export default function GlobePage() {
  const [open, setOpen] = useState(false)
  const { selectedCountry } = useGlobeStore()

  return (
    <main style={{height:'100vh',width:'100vw',position:'relative'}}>
      <GlobeCanvas onCountryClick={() => setOpen(true)} />
      {selectedCountry && <div className="country-badge">{selectedCountry.name} ({selectedCountry.iso3})</div>}
      {open && <CountryModal onClose={() => setOpen(false)} />}
    </main>
  )
}
