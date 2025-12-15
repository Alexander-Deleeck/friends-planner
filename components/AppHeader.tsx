 "use client";
 
 import Link from "next/link";
 import { usePathname, useRouter } from "next/navigation";
 import { Fragment, useMemo, useState } from "react";
 
 import { LogOut, Moon, Sun } from "lucide-react";
 
 import { Button } from "@/components/ui/button";
 
 type AppUser = {
   id: number;
   display_name: string;
 } | null;
 
 type Props = {
   user: AppUser;
 };
 
 const LABELS: Record<string, string> = {
   availability: "Availability",
   login: "Login",
 };
 
 function toTitleCase(seg: string) {
   return seg
     .replace(/[-_]+/g, " ")
     .replace(/\b\w/g, (m) => m.toUpperCase());
 }
 
 function useBreadcrumbs() {
   const pathname = usePathname() || "/";
 
   return useMemo(() => {
     const parts = pathname.split("?")[0].split("#")[0].split("/").filter(Boolean);
     const crumbs = [
       {
         href: "/",
         label: "Home",
       },
     ];
 
     let acc = "";
     for (const part of parts) {
       acc += `/${part}`;
       const label = LABELS[part] ?? toTitleCase(part);
       crumbs.push({ href: acc, label });
     }
     return crumbs;
   }, [pathname]);
 }
 
 type ThemeMode = "light" | "dark";
 const THEME_STORAGE_KEY = "theme";
 
 function applyTheme(next: ThemeMode) {
   if (typeof document === "undefined") return;
   const el = document.documentElement;
   if (next === "dark") {
     el.classList.add("dark");
     el.classList.remove("light");
   } else {
     el.classList.add("light");
     el.classList.remove("dark");
   }
 }
 
 function readTheme(): ThemeMode {
   if (typeof window === "undefined") return "light";
   const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
   if (saved === "dark" || saved === "light") return saved;
   const systemDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
   return systemDark ? "dark" : "light";
 }
 
 export function AppHeader({ user }: Props) {
   const router = useRouter();
   const crumbs = useBreadcrumbs();
 
   const [theme, setTheme] = useState<ThemeMode>(() => readTheme());
   const [loggingOut, setLoggingOut] = useState(false);
 
   const toggleTheme = () => {
     const next: ThemeMode = theme === "dark" ? "light" : "dark";
     setTheme(next);
     try {
       window.localStorage.setItem(THEME_STORAGE_KEY, next);
     } catch {
       // ignore
     }
     applyTheme(next);
   };
 
   const onLogout = async () => {
     setLoggingOut(true);
     try {
       await fetch("/api/auth/logout", { method: "POST" });
       router.refresh();
       router.push("/login");
     } finally {
       setLoggingOut(false);
     }
   };
 
   return (
     <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:border-zinc-800 dark:bg-zinc-950/70">
       <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
         <div className="flex min-w-0 items-center gap-3">
           <nav aria-label="Breadcrumb" className="min-w-0">
             <ol className="flex min-w-0 items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
               {crumbs.map((c, idx) => {
                 const isLast = idx === crumbs.length - 1;
                 return (
                   <Fragment key={c.href}>
                     <li className="min-w-0">
                       {isLast ? (
                         <span className="truncate font-semibold text-zinc-900 dark:text-zinc-100">{c.label}</span>
                       ) : (
                         <Link className="truncate hover:text-zinc-900 dark:hover:text-zinc-100" href={c.href}>
                           {c.label}
                         </Link>
                       )}
                     </li>
                     {!isLast && <li className="text-zinc-400 dark:text-zinc-600">/</li>}
                   </Fragment>
                 );
               })}
             </ol>
           </nav>
         </div>
 
         <div className="flex shrink-0 items-center gap-2">
           <Button
             type="button"
             variant="outline"
             size="icon"
             aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
             onClick={toggleTheme}
           >
             {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
           </Button>
 
           {user ? (
             <>
               <span className="hidden text-sm text-zinc-600 dark:text-zinc-300 sm:block">
                 Signed in as <span className="font-semibold text-zinc-900 dark:text-zinc-100">{user.display_name}</span>
               </span>
               <Button type="button" variant="outline" onClick={onLogout} disabled={loggingOut}>
                 <LogOut className="mr-2 size-4" />
                 Logout
               </Button>
             </>
           ) : (
             <Button asChild variant="outline">
               <Link href="/login">Login</Link>
             </Button>
           )}
         </div>
       </div>
     </header>
   );
 }
 

