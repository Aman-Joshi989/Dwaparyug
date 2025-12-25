"use client";
import { scaleOnHover } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Sparkles, Facebook, Instagram, Twitter, Linkedin, Heart, ArrowRight, X, Menu, UserCircle, Home, Target, Calendar, MoreHorizontal, Contact, GiftIcon, ShoppingBag, LogIn, LogOut } from 'lucide-react'
import React, { useState } from 'react'
import { Button } from '../ui/button'
import Link from "next/link";
import { useSession, signOut } from 'next-auth/react';
import { useMediaQuery } from 'react-responsive';
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";

// Import Shadcn UI Dropdown components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

// Mobile Bottom Navigation Component
const MobileBottomNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const { data: session } = useSession();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, href: '/' },
    { id: 'campaigns', label: 'Campaigns', icon: GiftIcon, href: '/causes' },
    { id: 'cart', label: 'Cart', icon: ShoppingBag, href: '/cart' },
  ];

  const menuItems = [
    { label: 'About Us', href: '/about-us' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Contact Us', href: '/contact-us' },
    { label: 'Cart', href: '/cart' },
    { label: 'Volunteer', href: '/volunteer' },
  ];

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden z-50 safe-area-bottom">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <button
                key={item.id}
                onClick={() => router.push(item.href)}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${isActive ? 'text-green-600' : 'text-gray-600'
                  }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}

          <button
            onClick={() => setShowMenu(!showMenu)}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${showMenu ? 'text-green-600' : 'text-gray-600'
              }`}
          >
            <MoreHorizontal className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Menu</span>
          </button>
        </div>
      </div>

      {/* Menu Overlay */}
      {showMenu && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setShowMenu(false)}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute bottom-16 left-0 right-0 bg-white rounded-t-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">More Options</h3>
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-gray-700 hover:text-green-600 font-medium px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => setShowMenu(false)}
                >
                  {item.label}
                </Link>
              ))}

              {/* Auth options in mobile menu */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                {session ? (
                  <>
                    <Link
                      href="/profile"
                      className="text-gray-700 hover:text-green-600 font-medium px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors block"
                      onClick={() => setShowMenu(false)}
                    >
                      My Profile
                    </Link>
                    <button
                      onClick={() => {
                        signOut();
                        setShowMenu(false);
                      }}
                      className="text-red-600 hover:text-red-700 font-medium px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors w-full text-left flex items-center"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      router.push('/auth/login');
                      setShowMenu(false);
                    }}
                    className="text-green-600 hover:text-green-700 font-medium px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors w-full text-left flex items-center"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Login
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.15, ease: "easeOut" },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.02,
    },
  },
}

const HeaderSection = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session } = useSession();
  const isMobile = useMediaQuery({ maxWidth: 1023 });
  const router = useRouter();

  // Check if user is a donor (role_id === 3)
  const isDonor = session?.user?.role_id === 3;
  console.log('session.user?.role?.toLowerCase', session && session.user?.role?.toLowerCase())
  const renderRightNav = () => {
    if (session && session.user) {

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
              <UserCircle className="h-6 w-6 text-gray-700 hover:text-green-600 transition-colors duration-150" />
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <div className="px-2 py-1.5 text-sm font-semibold">
              {session.user.name || session.user.email}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href="/cart" className="w-full">My Cart</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut()}
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    // Show login button if not logged in
    return (
      <Button
        variant="ghost"
        onClick={() => router.push('/auth/login')}
        className="text-gray-700 hover:text-green-600 font-medium transition-colors duration-150"
      >
        <LogIn className="w-4 h-4 mr-2" />
        Login
      </Button>
    );
  };

  return (
    <>
      <section className='top-0 sticky z-50'>
        <motion.nav
          className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50"
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
            <motion.div
              className="flex items-center cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.1 }}
            >
              <div className="from-gray-800 to-gray-900 rounded-lg">
                <Image
                  onClick={() => router.push("/")}
                  src="/images/logo/logo.png"
                  alt="Dwaparyug Logo"
                  width={240}
                  height={120}
                  priority
                />
              </div>
            </motion.div>

            <div className="hidden lg:flex items-center space-x-8">
              {["About Us", "How It Works", "Causes", "Contact Us"].map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.1, delay: index * 0.02 }}
                >
                  <Link
                    href={item === "Home" ? "/" : `/${item.toLowerCase().replace(/\s+/g, "-")}`}
                    className="text-gray-700 hover:text-green-600 font-medium relative group cursor-pointer transition-colors duration-150"
                  >
                    {item}
                    <motion.div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-600 group-hover:w-full transition-all duration-200" />
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center space-x-3 sm:space-x-6">
              <motion.div
                className="hidden sm:flex items-center space-x-2 lg:space-x-3"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                {[
                  { Icon: Facebook, color: "hover:text-blue-600", href: "https://www.facebook.com/profile.php?id=61575709810420" },
                  { Icon: Instagram, color: "hover:text-pink-600", href: "https://www.instagram.com/dwaparyugfoundation/" },
                  { Icon: Twitter, color: "hover:text-blue-400", href: "https://x.com/Dwapar_yug_" },
                  { Icon: Linkedin, color: "hover:text-blue-700", href: "https://www.linkedin.com/company/dwaparyug-foundation" },
                ].map(({ Icon, color, href }, index) => (
                  <motion.div key={index} variants={fadeInUp}>
                    <Link
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-gray-600 ${color} transition-all duration-150 cursor-pointer`}
                      {...scaleOnHover}
                    >
                      <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
                    </Link>
                  </motion.div>
                ))}
              </motion.div>

              {renderRightNav()}

              {/* Only show donate button if user is logged in and is a donor (role_id === 3) */}
              {isDonor && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.15, type: "spring", stiffness: 300 }}
                >
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 lg:px-8 py-2 sm:py-3 rounded-full font-semibold transition-all duration-200 cursor-pointer text-xs sm:text-sm lg:text-base"
                    {...scaleOnHover}
                    asChild
                  >
                    <Link href="/causes">
                      <Heart className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2 fill-current" />
                      Donate
                      <ArrowRight className="w-3 sm:w-4 h-3 sm:h-4 ml-1 sm:ml-2 hidden sm:inline" />
                    </Link>
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </motion.nav>
      </section>

      <MobileBottomNav />
    </>
  )
}

export default HeaderSection;