import { useState, useEffect, useCallback } from 'react'
import { memberService } from '../services/memberService'
import type { Member } from '../../../types/database'

export function useMembers(initialSearch = '') {
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [searchQuery, setSearchQuery] = useState(initialSearch)

  const fetchMembers = useCallback(async (search: string) => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await memberService.getAll(search)
      setMembers(data)
    } catch (err: any) {
      setError(err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchMembers(searchQuery)
    }, 300) // Debounce for search

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery, fetchMembers])

  return {
    members,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    refetch: () => fetchMembers(searchQuery),
  }
}
