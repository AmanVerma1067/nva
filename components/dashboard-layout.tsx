"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Home, User, Settings, Heart, AlertTriangle, Bell, LogOut, Zap } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Health Profile", href: "/profile", icon: Heart },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const { toast } = useToast();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged Out",
        description: "You have been signed out successfully",
      });
      router.push("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  const notifications = [
    {
      id: 1,
      type: "alert",
      title: "High Sodium Intake",
      message: "You've consumed 2,800mg sodium today.",
      time: "2 hours ago",
    },
    {
      id: 2,
      type: "success",
      title: "Goal Achievement",
      message: "You stayed within the carb limit.",
      time: "4 hours ago",
    },
  ];

  return (
    <div className="
      min-h-screen 
      w-full 
      overflow-x-hidden 

      bg-gradient-to-b 
      from-[#1a0b0d] 
      via-[#11060a] 
      to-black 
      dark:from-black 
      dark:via-[#0b0305] 
      dark:to-black
    ">

      {/* Top alert (darkened + warm tone) */}
      <div className="w-full bg-[#3a0f1f]/60 border-b border-[#ff4d6d]/20 backdrop-blur-md py-2 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-[#ff8fa3]" />
          <p className="text-sm text-[#ffd7e0]">
            Remember to log your morning medication.
          </p>
        </div>
        <Bell className="h-4 w-4 text-[#ff8fa3]" />
      </div>

      {/* Header */}
      <header className="
        sticky top-0 z-50 w-full 
        backdrop-blur-xl 
        bg-[#1a0b0d]/60 
        dark:bg-black/60 
        border-b border-[#ff4d6d]/10
      ">
        <div className="w-full px-4 lg:px-6 flex items-center justify-between h-16">

          {/* Left section */}
          <div className="flex items-center gap-4">

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-white">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>

              <SheetContent
                side="left"
                className="w-64 border-r border-[#ff4d6d]/20 bg-[#150508] text-white"
              >
                <nav className="mt-10 space-y-2">
                  {navigation.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition",
                        pathname === item.href
                          ? "bg-[#8b1e3f] text-white shadow-lg shadow-[#8b1e3f]/40"
                          : "hover:bg-[#2c0911] text-gray-300"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-[#8b1e3f] flex items-center justify-center text-white shadow shadow-[#ff4d6d]/40">
                <Heart className="h-4 w-4" />
              </div>
              <h1 className="text-xl font-semibold tracking-tight text-white">Nutri Vision AI</h1>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm transition",
                  pathname === item.href
                    ? "bg-[#8b1e3f] text-white shadow-lg shadow-[#8b1e3f]/40"
                    : "hover:bg-[#2c0911] text-gray-300"
                )}
              >
                <div className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </div>
              </Link>
            ))}
          </nav>

          {/* Right section actions */}
          <div className="flex items-center gap-3 relative">

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative text-white"
            >
              <Bell className="h-5 w-5" />
              <Badge className="
                absolute -top-1 -right-1 
                bg-[#ff4d6d] 
                text-[10px] 
                h-5 w-5 p-0 
                rounded-full
              ">
                {notifications.length}
              </Badge>
            </Button>

            {/* Notification Panel */}
            {notificationsOpen && (
              <div className="
                absolute right-0 top-12 w-80 
                backdrop-blur-xl 
                bg-[#1a0b0d]/90 
                border border-[#ff4d6d]/20 
                rounded-xl shadow-xl overflow-hidden text-white
              ">
                <div className="p-4 border-b border-[#ff4d6d]/10">
                  <h3 className="font-semibold">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id}
                      className="p-4 flex gap-3 border-b border-[#ff4d6d]/10 hover:bg-[#2c0911] transition"
                    >
                      {n.type === "alert" ? (
                        <AlertTriangle className="h-5 w-5 text-[#ff6b81]" />
                      ) : (
                        <Zap className="h-5 w-5 text-green-400" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{n.title}</p>
                        <p className="text-xs opacity-70">{n.message}</p>
                        <p className="text-[10px] opacity-60 mt-1">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full text-white">
                  <div className="h-8 w-8 bg-[#8b1e3f] rounded-full text-white flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#1a0b0d] text-white border border-[#ff4d6d]/20">
                <div className="px-3 py-2 text-sm">
                  <p className="font-medium">Account</p>
                  <p className="text-xs opacity-70">{user?.email}</p>
                </div>
                <DropdownMenuSeparator className="bg-[#ff4d6d]/20" />

                <DropdownMenuItem asChild className="hover:bg-[#2c0911]">
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="hover:bg-[#2c0911]">
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-[#ff4d6d]/20" />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-400 hover:bg-[#3a0f1f]"
                >
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="w-full px-4 lg:px-6 py-6 text-white">
        {children}
      </main>
    </div>
  );
}
