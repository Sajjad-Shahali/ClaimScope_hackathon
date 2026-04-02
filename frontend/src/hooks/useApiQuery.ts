import { useQuery } from '@tanstack/react-query';

export function useApiQuery<T>(queryKey: unknown[], queryFn: () => Promise<T>, enabled = true) {
  return useQuery({
    queryKey,
    queryFn,
    enabled,
  });
}
