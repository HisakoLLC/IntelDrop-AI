'use server'

import { createClient } from '@/lib/supabase-server'
import { subDays, format, eachDayOfInterval } from 'date-fns'

export async function getInsightMetrics() {
  const supabase = await createClient()

  // Ensure caller is authenticated securely resolving edge cookies
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) {
    throw new Error('Unauthorized Setup Request Invoked')
  }

  const thirtyDaysAgo = subDays(new Date(), 30)

  // Fetch only necessary indexing columns isolating the ciphertext from download loops
  const { data: tips, error } = await supabase
    .from('tips')
    .select('category, created_at')
    .gte('created_at', thirtyDaysAgo.toISOString())

  if (error || !tips) {
    console.error('Database query targeting structural metrics structurally failed:', error)
    return { volumeData: [], categoryData: [] }
  }

  // 1. Calculate 30-Day Volume Map padding empty interval values directly
  const daysArray = eachDayOfInterval({
    start: thirtyDaysAgo,
    end: new Date()
  })

  // Hash natively 
  const volumeMap = new Map<string, number>()
  daysArray.forEach(d => {
    volumeMap.set(format(d, 'MMM dd'), 0)
  })

  tips.forEach(row => {
    const rawDate = row.created_at ? new Date(row.created_at) : new Date()
    const label = format(rawDate, 'MMM dd')
    if (volumeMap.has(label)) {
      volumeMap.set(label, volumeMap.get(label)! + 1)
    }
  })

  const volumeData = Array.from(volumeMap.entries()).map(([date, count]) => ({
    date,
    count
  }))

  // 2. Hash breakdown mapped over category strings
  const categoryMap = new Map<string, number>()
  tips.forEach(row => {
    const cat = row.category || 'UNCLASSIFIED'
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1)
  })

  // Explicit array definitions targeting exact UI mappings omitting color arrays safely 
  const allowedColors = ['#000000', '#e5e5e5']
  
  const categoryData = Array.from(categoryMap.entries()).map(([name, value], index) => ({
    name,
    value,
    fill: allowedColors[index % allowedColors.length]
  }))

  return { volumeData, categoryData }
}
