/** Shown to visitors when the owner switched their public profile off. */
export function ProfilePrivate({ username }: { username: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center">
      <h1 className="font-display text-2xl text-foreground">Dit profiel is privé</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        <span className="font-mono">@{username}</span>
      </p>
    </div>
  );
}
