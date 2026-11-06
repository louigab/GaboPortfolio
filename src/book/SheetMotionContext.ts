import { createContext } from 'react'

// Moving page copies are printed snapshots; their contents must not animate independently.
export const SheetMotionContext = createContext(true)
