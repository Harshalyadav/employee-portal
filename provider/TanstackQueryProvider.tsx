"use client";

import {
  dehydrate,
  HydrationBoundary,
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PropsWithChildren, useState } from "react";
import { Toaster } from "sonner";

type QueryProviderProps = PropsWithChildren<{
  devtoolsInitiallyOpen?: boolean;
}>;

export function TanstackQueryProvider({
  children,
  devtoolsInitiallyOpen = false,
}: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache(),
        mutationCache: new MutationCache(),
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 1000 * 60 * 2,
          },
          mutations: {
            retry: false,
          },
        },
      })
  );

  const dehydratedState = dehydrate(queryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydratedState}>{children}</HydrationBoundary>
      <ReactQueryDevtools initialIsOpen={devtoolsInitiallyOpen} />
      <Toaster />
    </QueryClientProvider>
  );
}
