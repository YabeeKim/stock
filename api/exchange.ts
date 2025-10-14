// /api/exchange.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'

export default async function handler(_: VercelRequest, res: VercelResponse) {
    try {
        const response = await axios.get(
            'https://query1.finance.yahoo.com/v8/finance/chart/KRW=X?interval=1d&range=1d'
        )

        res.setHeader('Access-Control-Allow-Origin', '*')
        res.status(200).json(response.data)
    } catch (error: any) {
        console.error('Yahoo API Error:', error.message)
        res.status(500).json({ error: 'Failed to fetch exchange rate' })
    }
}
