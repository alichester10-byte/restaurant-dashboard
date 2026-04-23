function LoadingCard() {
  return <div className="h-32 animate-pulse rounded-[28px] bg-white/65" />;
}

export default function ProtectedLoading() {
  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-[28px] p-5">
        <div className="h-4 w-32 animate-pulse rounded-full bg-white/70" />
        <div className="mt-4 h-10 w-64 animate-pulse rounded-full bg-white/80" />
        <div className="mt-3 h-5 w-full max-w-2xl animate-pulse rounded-full bg-white/65" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <LoadingCard />
        <LoadingCard />
        <LoadingCard />
        <LoadingCard />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="glass-panel rounded-[28px] p-5">
          <div className="h-4 w-28 animate-pulse rounded-full bg-white/70" />
          <div className="mt-6 h-72 animate-pulse rounded-[24px] bg-white/75" />
        </div>
        <div className="glass-panel rounded-[28px] p-5">
          <div className="h-4 w-28 animate-pulse rounded-full bg-white/70" />
          <div className="mt-6 space-y-3">
            <div className="h-20 animate-pulse rounded-[24px] bg-white/75" />
            <div className="h-20 animate-pulse rounded-[24px] bg-white/75" />
            <div className="h-20 animate-pulse rounded-[24px] bg-white/75" />
          </div>
        </div>
      </div>
    </div>
  );
}
