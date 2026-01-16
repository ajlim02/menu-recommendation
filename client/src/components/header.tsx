import { Link, useLocation } from "wouter";
import { ThemeToggle } from "./theme-toggle";
import { UtensilsCrossed, ClipboardList, Sparkles, Settings, LogIn, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

const navItems = [
  { href: "/", label: "설정", icon: Settings },
  { href: "/records", label: "기록 입력", icon: ClipboardList },
  { href: "/recommendations", label: "추천", icon: Sparkles },
];

export function Header() {
  const [location] = useLocation();
  const { user, isLoading, isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <div className="flex h-14 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <UtensilsCrossed className="h-4 w-4" />
            </div>
            <span className="hidden font-semibold sm:inline-block" data-testid="text-app-title">
              오늘 뭐 먹지?
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <button
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover-elevate",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground"
                    )}
                    data-testid={`nav-${item.label}`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </button>
                </Link>
              );
            })}
            <div className="ml-2 flex items-center gap-2 border-l pl-2">
              <ThemeToggle />
              {isLoading ? (
                <Skeleton className="h-8 w-8 rounded-full" />
              ) : isAuthenticated && user ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName || "User"} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <a href="/api/logout">
                    <Button variant="ghost" size="sm" className="gap-1.5" data-testid="button-logout">
                      <LogOut className="h-4 w-4" />
                      <span className="hidden sm:inline">로그아웃</span>
                    </Button>
                  </a>
                </div>
              ) : (
                <a href="/api/login">
                  <Button variant="default" size="sm" className="gap-1.5" data-testid="button-login">
                    <LogIn className="h-4 w-4" />
                    <span className="hidden sm:inline">로그인</span>
                  </Button>
                </a>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
