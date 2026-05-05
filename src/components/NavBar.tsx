import Link from "next/link";
import { Utensils } from "lucide-react";
import { getSession } from "@/lib/auth";

export default async function NavBar() {
  const session = await getSession();

  return (
    <nav className="w-full bg-cream border-b border-rust/10 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-ink hover:opacity-80 transition-opacity">
          <Utensils className="w-6 h-6 text-rust" />
          <span className="font-cormorant text-2xl font-bold tracking-wide">Moodine</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-ink/80 hover:text-rust transition-colors font-dm-mono uppercase tracking-wider">
            Explore
          </Link>
          <Link href="/owner/submit" className="text-sm font-medium text-ink/80 hover:text-rust transition-colors font-dm-mono uppercase tracking-wider">
            For Owners
          </Link>
          <Link href="/admin" className="text-sm font-medium text-ink/80 hover:text-rust transition-colors font-dm-mono uppercase tracking-wider">
            Admin
          </Link>
          
          {session ? (
            <div className="flex items-center gap-4 border-l border-rust/20 pl-6">
              <span className="text-sm font-medium text-ink font-dm-mono">My Account</span>
              <Link href="/api/auth/logout" prefetch={false} className="text-sm font-medium bg-rust text-cream px-4 py-2 rounded-full hover:bg-rust/90 transition-colors font-dm-mono uppercase tracking-wider">
                Logout
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-4 border-l border-rust/20 pl-6">
              <Link href="/login" className="text-sm font-medium text-ink hover:text-rust transition-colors font-dm-mono uppercase tracking-wider">
                Sign In
              </Link>
              <Link href="/register" className="text-sm font-medium bg-ink text-cream px-4 py-2 rounded-full hover:bg-ink/80 transition-colors font-dm-mono uppercase tracking-wider">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
