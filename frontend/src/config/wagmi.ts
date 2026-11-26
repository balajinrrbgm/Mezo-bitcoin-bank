import { getConfig, matsnetTestnetChain } from '@mezo-org/passport'
import { QueryClient } from '@tanstack/react-query'

export const wagmiConfig = getConfig({
  appName: 'BitBank – Bitcoin Self-Service Bank',
})

export { matsnetTestnetChain }

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 12_000,   // 12 seconds
      refetchInterval: 15_000,
    },
  },
})
