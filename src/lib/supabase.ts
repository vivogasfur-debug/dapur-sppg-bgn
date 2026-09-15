import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Build a Supabase query with common options (filter, ilike, order).
 */
function buildQuery(table: string, options?: {
  select?: string;
  order?: { column: string; ascending?: boolean };
  filter?: { column: string; operator: string; value: any };
  ilike?: { column: string; value: string };
}) {
  let query = supabase.from(table).select(options?.select || '*', { count: 'exact' })

  if (options?.filter) {
    query = query.filter(
      options.filter.column,
      options.filter.operator as any,
      options.filter.value
    )
  }

  if (options?.ilike) {
    query = query.ilike(options.ilike.column, options.ilike.value)
  }

  if (options?.order) {
    query = query.order(options.order.column, { ascending: options.order.ascending ?? true })
  }

  return query
}

/**
 * Fetch ALL rows from a Supabase table, bypassing the 1000-row default limit.
 * Optimized: fetches first page to get count, then fetches remaining pages in parallel.
 */
export async function fetchAll<T = any>(
  table: string,
  options?: {
    select?: string;
    order?: { column: string; ascending?: boolean };
    filter?: { column: string; operator: string; value: any };
    ilike?: { column: string; value: string };
  }
): Promise<T[]> {
  const pageSize = 1000

  // Step 1: Fetch first page with count to know total rows
  const firstQuery = buildQuery(table, options)
  const { data: firstData, error: firstError, count } = await firstQuery.range(0, pageSize - 1)

  if (firstError) throw firstError
  if (!firstData || firstData.length === 0) return []

  // If all rows fit in one page, return immediately
  if (!count || count <= firstData.length) {
    return firstData as T[]
  }

  const totalPages = Math.ceil(count / pageSize)

  // Step 2: Fetch remaining pages in parallel (batches of 4 to avoid overwhelming Supabase)
  const remainingPageIndices: number[] = []
  for (let page = 1; page < totalPages; page++) {
    remainingPageIndices.push(page)
  }

  const batchSize = 4
  const batchResults: T[][] = []

  for (let i = 0; i < remainingPageIndices.length; i += batchSize) {
    const batch = remainingPageIndices.slice(i, i + batchSize)
    const promises = batch.map(async (page) => {
      const from = page * pageSize
      const query = buildQuery(table, options)
      const { data, error } = await query.range(from, from + pageSize - 1)
      if (error) throw error
      return (data || []) as T[]
    })
    const results = await Promise.all(promises)
    batchResults.push(...results)
  }

  // Combine all data in order
  let allData: T[] = [...(firstData as T[])]
  for (const batch of batchResults) {
    allData = allData.concat(batch)
  }

  return allData
}
