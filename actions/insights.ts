'use server'

import { createClient } from '@/lib/supabase-server'
import { subDays, format, eachDayOfInterval, startOfMonth, isAfter } from 'date-fns'

export async function getInsightMetrics() {
  const supabase = await createClient()

  // Ensure caller is authenticated securely resolving edge cookies
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) {
    throw new Error('Unauthorized Setup Request Invoked')
  }

  const now = new Date()
  const thirtyDaysAgo = subDays(now, 30)
  const monthStart = startOfMonth(now)

  // Fetch only necessary indexing columns isolating the ciphertext 
  const { data: tips, error } = await supabase
    .from('tips')
    .select('category, priority, created_at')
    .gte('created_at', thirtyDaysAgo.toISOString())

  if (error || !tips) {
    console.error('Database query targeting structural metrics structurally failed:', error)
    return { 
      volumeData: [], 
      categoryData: [], 
      summary: { totalMonth: 0, highPriority: 0, topCategory: 'N/A' } 
    }
  }

  // 1. Calculate 30-Day Volume Map padding empty interval values directly
  const daysArray = eachDayOfInterval({
    start: thirtyDaysAgo,
    end: now
  })

  const volumeMap = new Map<string, number>()
  daysArray.forEach(d => {
    volumeMap.set(format(d, 'MMM dd'), 0)
  })

  let totalMonth = 0
  let highPriority = 0
  const categoryMap = new Map<string, number>()

  tips.forEach(row => {
    const rawDate = row.created_at ? new Date(row.created_at) : new Date()
    
    // Aggregation for volume chart (30 days)
    const label = format(rawDate, 'MMM dd')
    if (volumeMap.has(label)) {
      volumeMap.set(label, volumeMap.get(label)! + 1)
    }

    // Aggregation for summary row (This Month)
    if (isAfter(rawDate, monthStart)) {
      totalMonth++
    }

    // Aggregation for summary row (High Priority - 30 days)
    if (row.priority === 'High') {
      highPriority++
    }

    // Aggregation for donut chart (30 days)
    const cat = row.category || 'Other'
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1)
  })

  const volumeData = Array.from(volumeMap.entries()).map(([date, count]) => ({
    date,
    count
  }))

  const allowedColors = ['#000000', '#737373', '#d4d4d4', '#404040']
  const categoryData = Array.from(categoryMap.entries()).map(([name, value], index) => ({
    name,
    value,
    fill: allowedColors[index % allowedColors.length]
  }))

  // Identify top category
  let topCategory = 'N/A'
  let maxCount = 0
  categoryMap.forEach((count, cat) => {
    if (count > maxCount) {
      maxCount = count
      topCategory = cat
    }
  })

  return { 
    volumeData, 
    categoryData, 
    summary: { totalMonth, highPriority, topCategory } 
  }
}
