import { create } from "zustand"

type Country = { iso3: string; name: string }

type State = {
  selectedCountry: Country | null
  setCountry: (c: Country | null) => void
}

const useGlobeStore = create<State>((set) => ({
  selectedCountry: null,
  setCountry: (c) => set({ selectedCountry: c })
}))

export default useGlobeStore
