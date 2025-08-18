import Link from "next/link";
import DiceCanvas from "@/components/DiceCanvas";

export default function Home() {
  return (
    <div className="w-full max-w-3xl px-6 flex flex-col items-center gap-6">
      <DiceCanvas />
      <div className="flex gap-4 items-center">
        <Link
          className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
          href="/leaderboard"
        >
          Leaderboard
        </Link>
        <Link
          className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
          href="/stats"
        >
          Stats
        </Link>
      </div>
    </div>
  );
}
