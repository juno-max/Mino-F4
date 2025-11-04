import { create } from 'zustand'

interface MenuStore {
  menuOpen: boolean
  setMenuOpen: (open: boolean) => void
}

export const useMenuStore = create<MenuStore>((set) => ({
  menuOpen: false,
  setMenuOpen: (open) => set({ menuOpen: open }),
}))
