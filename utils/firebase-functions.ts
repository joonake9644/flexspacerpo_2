import { getFunctions } from 'firebase/functions'
import app from '@/firebase'

// Shared Functions instance to avoid duplicate initializations across chunks
export const functions = getFunctions(app)
