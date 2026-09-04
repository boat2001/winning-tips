import { LoadingStatus, Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-7 sm:py-10">
      <LoadingStatus />
      <Skeleton className="h-9 w-64 rounded-sharp" />
      <section className="mt-8 grid gap-3 sm:grid-cols-3">{[0, 1, 2].map((card) => <div key={card} className="rounded-sharp border border-line bg-white p-5"><Skeleton className="h-8 w-16 rounded" /><Skeleton className="mt-4 h-4 w-24 rounded" /><Skeleton className="mt-3 h-3 w-full rounded" /></div>)}</section>
      <section className="mt-7 overflow-hidden rounded-sharp border border-line bg-white"><div className="border-b border-line p-5"><Skeleton className="h-5 w-36 rounded" /></div><div className="space-y-5 p-5">{[0, 1, 2, 3, 4].map((row) => <div key={row}><Skeleton className="h-4 w-2/3 rounded" /><Skeleton className="mt-2 h-3 w-1/2 rounded" /></div>)}</div></section>
    </main>
  );
}
