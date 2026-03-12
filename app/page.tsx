import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center gap-8 py-20 text-center">
      <div className="space-y-4 max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl text-foreground">
          Friends Planner
        </h1>
        <p className="text-lg text-muted-foreground">
          Coordinate availability and events with your friends. Simple, fast, and no login required for guests.
        </p>
      </div>

      <div className="flex gap-4">
        <Button asChild size="lg">
          <Link href="/availability">Go to Planner</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="https://github.com/yourusername/friends-planner" target="_blank">
            GitHub
          </Link>
        </Button>
      </div>
    </div>
  );
}
