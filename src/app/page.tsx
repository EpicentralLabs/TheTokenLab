import TheTokenLab from '@/components/TheTokenLab'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The Token Lab | Epicentral Labs',
  description: "Solana's most simple no-code token creator",
}

export default function Home() {
  return <TheTokenLab />
}
