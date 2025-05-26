// src/components/Navbar.tsx
'use client'; // This is important if you use Hooks like useState, or interactive elements

import Link from 'next/link'; // For client-side navigation without full page reloads

export default function Navbar() {
  return (
    <nav className="bg-gradient-to-r from-blue-700 via-purple-700 to-indigo-700 p-4 shadow-lg fixed top-0 w-full z-50">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo or Site Title */}
        <Link href="/" className="text-white text-2xl font-bold hover:text-gray-200 transition-colors duration-300">
          CareerBot
        </Link>

        {/* Navigation Links */}
        <div className="space-x-8"> {/* Increased space-x for better separation */}
          <Link href="/" className="text-white text-lg font-medium hover:text-yellow-300 transition-colors duration-300">
            Home
          </Link>
          <Link href="/contact" className="text-white text-lg font-medium hover:text-yellow-300 transition-colors duration-300">
            Contact
          </Link>
          <Link href="/about" className="text-white text-lg font-medium hover:text-yellow-300 transition-colors duration-300">
            About
          </Link>
          <Link href="/advance-ai" className="text-white text-lg font-medium hover:text-yellow-300 transition-colors duration-300">
            Advance AI
          </Link>
        </div>
      </div>
    </nav>
  );
}