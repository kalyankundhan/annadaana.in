"use client";

export function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-primary border-b-secondary border-l-secondary animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-4 border-t-accent border-r-accent border-b-transparent border-l-transparent animate-spin [animation-delay:200ms]"></div>
        </div>
        <p className="text-lg font-medium text-foreground">Loading...</p>
      </div>
    </div>
  );
}
