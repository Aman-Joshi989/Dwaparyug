"use client"

import type React from "react"
import Link from "next/link"
import {
  LayoutDashboard,
  PlusCircle,
  Package,
  ListChecks,
  Users,
  DollarSign,
  Boxes,
  MenuIcon,
  X,
  ChevronDown,
  ChevronUp,
  LogOut,
  User,
  Sticker,
} from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { signOut, useSession } from "next-auth/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AdminLink {
  name: string
  href: string
  icon: React.ElementType
  subLinks?: AdminLink[]
}

const adminLinks: AdminLink[] = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  {
    name: "Products",
    href: "/admin/products",
    icon: Package,
    subLinks: [
      { name: "All Products", href: "/admin/products", icon: ListChecks },
      { name: "All units", href: "/admin/units", icon: Boxes },
    ],
  },
  {
    name: "Campaigns", href: "/admin/campaigns", icon: PlusCircle,
    subLinks: [
      { name: "All Campaigns", href: "/admin/campaigns", icon: ListChecks },
      { name: "Add Campaigns", href: "/admin/campaigns/create", icon: PlusCircle },
    ],
  },
  { name: "Donations", href: "/admin/donations", icon: DollarSign },
  {
    name: "Batches",
    href: "/admin/batches",
    icon: Package,
    subLinks: [
      { name: "All Batches", href: "/admin/batches", icon: ListChecks },
      { name: "Manual Stickers", href: "/admin/batches/manual-stickers", icon: Sticker },
      { name: "Add Batches", href: "/admin/batches/add", icon: PlusCircle },
    ],
  },
  { name: "Users & Roles", href: "/admin/users", icon: Users },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({})

  const toggleSubmenu = (name: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [name]: !prev[name] }))
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/auth/login" })
  }

  const getInitials = (name?: string | null) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const renderLinks = (links: AdminLink[]) => {
    return links.map((link) => (
      <div key={link.name}>
        {link.subLinks ? (
          <div>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-between items-center text-sm font-medium hover:bg-muted transition",
                pathname.startsWith(link.href) && "bg-muted font-semibold"
              )}
              onClick={() => toggleSubmenu(link.name)}
            >
              <div className="flex items-center gap-2">
                <link.icon className="h-4 w-4" />
                {link.name}
              </div>
              {openSubmenus[link.name] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {openSubmenus[link.name] && (
              <div className="ml-4 mt-1 space-y-1">
                {link.subLinks.map((subLink) => (
                  <Link
                    key={subLink.name}
                    href={subLink.href}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted transition",
                      pathname === subLink.href && "bg-muted font-semibold"
                    )}
                    onClick={() => setIsSheetOpen(false)}
                    prefetch={false}
                  >
                    <subLink.icon className="h-4 w-4" />
                    {subLink.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Link
            href={link.href}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted transition",
              pathname === link.href && "bg-muted font-semibold"
            )}
            onClick={() => setIsSheetOpen(false)}
            prefetch={false}
          >
            <link.icon className="h-4 w-4" />
            {link.name}
          </Link>
        )}
      </div>
    ))
  }

  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex w-52 flex-col border-r bg-muted/40 sticky top-0 h-screen">
        {/* Logo Section */}
        <div className="pt-[15px] flex items-center gap-2 px-4 pb-4 border-b">
          <Link href="/admin" className="flex items-center gap-2 font-semibold">
            <Package className="h-6 w-6" />
            <span>Dwaparyug</span>
          </Link>
        </div>

        <nav className="space-y-1 px-2 py-2">
          {renderLinks(adminLinks)}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-4 border-b bg-background pl-0 px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <div>
                  <Button variant="ghost" size="icon" className="font-xl md:hidden">
                    {isSheetOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </div>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-4">
                {/* Logo inside mobile sheet */}
                <div className="flex items-center gap-2 pb-4 border-b">
                  <Link href="/admin" className="flex items-center gap-2 font-semibold" onClick={() => setIsSheetOpen(false)}>
                    <Package className="h-6 w-6" />
                    <span>Dwaparyug </span>
                  </Link>
                </div>
                <nav className="grid gap-2">
                  {renderLinks(adminLinks)}
                </nav>
              </SheetContent>
            </Sheet>
            <h1 className="text-base font-semibold md:text-lg">Admin</h1>
          </div>

          {/* Profile and Logout Buttons */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || "User"} />
                    <AvatarFallback>{getInitials(session?.user?.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{session?.user?.name || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{session?.user?.email}</p>
                    {session?.user?.role && (
                      <p className="text-xs leading-none text-muted-foreground mt-1">
                        Role: {session.user.role}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* <DropdownMenuItem asChild>
                  <Link href="/admin/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem> */}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-3 md:p-6 space-y-4">{children}</main>
      </div>
    </div>
  )
}