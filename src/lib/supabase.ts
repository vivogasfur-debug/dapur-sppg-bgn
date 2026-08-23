import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Fetch ALL rows from a Supabase table, bypassing the 1000-row default limit.
 * Uses range-based pagination internally.
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
  let allData: T[] = []
  let from = 0
  let hasMore = true

  while (hasMore) {
    let query = supabase.from(table).select(options?.select || '*')

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

    const { data, error } = await query.range(from, from + pageSize - 1)

    if (error) throw error
    if (!data || data.length === 0) break

    allData = allData.concat(data as T[])
    hasMore = data.length === pageSize
    from += pageSize
  }

  return allData
}