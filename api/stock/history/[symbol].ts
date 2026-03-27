// /api/stock/history/[symbol].ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { symbol, range = '1y', interval = '1d' } = req.query

    if (!symbol || typeof symbol !== 'string') {
        return res.status(400).json({ error: 'Invalid symbol' })
    }

    try {
        const response = await axios.get(
            `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`
        )

        res.setHeader('Access-Control-Allow-Origin', '*')
        res.status(200).json(response.data)
    } catch (error: any) {
        console.error('Yahoo API Error:', error.message)
        res.status(500).json({ error: 'Failed to fetch historical data' })
    }
}
