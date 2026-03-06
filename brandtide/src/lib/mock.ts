import dayjs from 'dayjs'

export const brands = ['Aurora', 'Nimbus', 'Vertex']
export const products = [
  { id: 'P-100', brand: 'Aurora', name: 'Aurora X1' },
  { id: 'P-101', brand: 'Aurora', name: 'Aurora Mini' },
  { id: 'P-200', brand: 'Nimbus', name: 'Nimbus Air' },
  { id: 'P-201', brand: 'Nimbus', name: 'Nimbus Max' },
  { id: 'P-300', brand: 'Vertex', name: 'Vertex Pro' },
  { id: 'P-301', brand: 'Vertex', name: 'Vertex Lite' },
]

export function genSentimentSeries(days=30){
  const out: { date: string; pos: number; neu: number; neg: number }[] = []
  for(let i=days-1;i>=0;i--){
    out.push({
      date: dayjs().subtract(i,'day').format('YYYY-MM-DD'),
      pos: Math.floor(40 + Math.random()*40),
      neu: Math.floor(10 + Math.random()*20),
      neg: Math.floor(10 + Math.random()*30),
    })
  }
  return out
}

export function sampleDistribution(){
  return [
    { name: 'Positive', value: 62 },
    { name: 'Neutral', value: 18 },
    { name: 'Negative', value: 20 },
  ]
}

export function topProducts(){
  const list = products.map(p => ({
    ...p,
    count: Math.floor(200 + Math.random()*800),
    conf: +(0.7 + Math.random()*0.3).toFixed(2),
  }))
  const pos = [...list].sort((a,b)=>b.count - a.count).slice(0,10)
  const neg = [...list].sort((a,b)=>a.count - b.count).slice(0,10)
  return { pos, neg }
}

export function representativeReviews(kind:'pos'|'neg', n=10){
  const base = [
    'Battery lasts all day even with GPS.',
    'Build quality feels premium for the price.',
    'Camera struggles in low light situations.',
    'Customer support was quick and helpful.',
    'The latest update fixed most of my issues.',
    'The UI is smooth but has occasional stutters.',
    'Great value and solid performance overall.',
    'Speaker quality is tinny at high volumes.',
    'Love the compact size and feel.',
    'Shipping took longer than expected.'
  ]
  return Array.from({length:n}, (_,i)=>({
    id: `${kind}-${i}`,
    snippet: base[(i+ (kind==='neg'?2:0)) % base.length],
    product: products[i%products.length],
    freq: Math.floor(5 + Math.random()*20),
    conf: +(0.7 + Math.random()*0.3).toFixed(2),
  }))
}
