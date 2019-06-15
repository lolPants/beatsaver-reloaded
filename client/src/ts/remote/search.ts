import pDebounce from 'p-debounce'
import { QueryType, SearchType } from '../components/Beatmap/BeatmapAPI'
import { axios } from '../utils/axios'

interface ISearchResult {
  value: IBeatmap[]
  done: boolean
}

export const createSearch = () => {
  let nextPage: number | null = 0

  let lastType: string | undefined
  let lastQuery: string | undefined

  interface ISearchOptions {
    type: SearchType | QueryType
    query?: string

    reset?: boolean
  }

  const fetch: (options: ISearchOptions) => Promise<ISearchResult> = async ({
    type,
    query,
    reset,
  }) => {
    if (reset || type !== lastType || query !== lastQuery) nextPage = 0
    if (nextPage === null) {
      return {
        done: true,
        value: [],
      }
    }

    const isUser = type === 'uploader'
    const isSearch = type === 'text' || type === 'hash'
    if ((isUser || isSearch) && !query) {
      return {
        done: true,
        value: [],
      }
    }

    const url = isUser
      ? `/maps/${type}/${query}/${nextPage}`
      : isSearch
      ? `/search/${type}/${nextPage}?q=${encodeURIComponent(query || '')}`
      : `/maps/${type}/${nextPage}`

    const resp = await axios.get<IBeatmapResponse>(url)
    nextPage = resp.data.nextPage

    lastType = type
    lastQuery = query

    return {
      done: resp.data.nextPage === null,
      value: resp.data.docs,
    }
  }

  const dFetch = pDebounce(fetch, 200)

  return {
    next: dFetch,
  }
}
