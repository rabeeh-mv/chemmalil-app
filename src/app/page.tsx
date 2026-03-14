"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, Users, ArrowRight, UserPlus, LogIn, BookOpen, GraduationCap, UserCircle } from "lucide-react";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("home");

  const stats = [
    { label: "Members", value: "10,000+", icon: Users, color: "from-emerald-500 to-teal-500" },
    { label: "Houses", value: "2,000+", icon: Home, color: "from-teal-500 to-cyan-500" },
    { label: "Madrasas", value: "10", icon: BookOpen, color: "from-cyan-500 to-blue-500" },
    { label: "Colleges", value: "2", icon: GraduationCap, color: "from-blue-500 to-indigo-500" }
  ];

  const committee = [
    { role: "President", name: "Mohammed Ali" },
    { role: "Vice President", name: "Abdul Rahman" },
    { role: "Secretary", name: "Ibrahim Kutty" },
    { role: "Joint Secretary", name: "Usman Haji" },
    { role: "Treasurer", name: "Aboobacker" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 md:pb-0">
      {/* Desktop Navigation */}
      <nav className="hidden md:block bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center shadow-md">
                <Home className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                Chemmalil Mahall
              </span>
            </div>

            <div className="flex items-center space-x-6">
              <Link
                href="/"
                className="text-slate-600 hover:text-emerald-600 font-medium transition-colors"
              >
                Home
              </Link>
              <Link
                href="/register"
                className="text-slate-600 hover:text-emerald-600 font-medium transition-colors"
              >
                Register
              </Link>
              <Link
                href="/login"
                className="bg-emerald-600 text-white px-6 py-2 rounded-full font-medium hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50 rounded-t-3xl border-t border-slate-100">
        <div className="grid grid-cols-3 gap-1 px-4 py-3">
          <Link
            href="/"
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center justify-center py-2 rounded-xl transition-all ${activeTab === "home" ? "text-emerald-600 font-semibold" : "text-slate-500 hover:text-emerald-500"
              }`}
          >
            <Home className={`w-6 h-6 mb-1 ${activeTab === "home" ? "scale-110" : ""}`} />
            <span className="text-xs">Home</span>
          </Link>
          <Link
            href="/register"
            onClick={() => setActiveTab("register")}
            className={`flex flex-col items-center justify-center py-2 rounded-xl transition-all ${activeTab === "register" ? "text-emerald-600 font-semibold" : "text-slate-500 hover:text-emerald-500"
              }`}
          >
            <UserPlus className={`w-6 h-6 mb-1 ${activeTab === "register" ? "scale-110" : ""}`} />
            <span className="text-xs">Register</span>
          </Link>
          <Link
            href="/login"
            onClick={() => setActiveTab("login")}
            className={`flex flex-col items-center justify-center py-2 rounded-xl transition-all ${activeTab === "login" ? "text-emerald-600 font-semibold" : "text-slate-500 hover:text-emerald-500"
              }`}
          >
            <LogIn className={`w-6 h-6 mb-1 ${activeTab === "login" ? "scale-110" : ""}`} />
            <span className="text-xs">Login</span>
          </Link>
        </div>
      </nav>

      {/* Section 1: Hero */}
      <section className="relative px-4 pt-20 pb-28 md:pt-32 md:pb-40 overflow-hidden flex flex-col items-center text-center">
        {/* Abstract Background Shapes */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-200/40 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[50%] bg-teal-200/40 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl mx-auto space-y-8 fade-in-up">
          <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-sm tracking-wide shadow-sm border border-emerald-200">
            Welcome to Our Great Community
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Welcome to <br />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              Chemmalil Mahall
            </span>
          </h1>
          <p className="text-lg md:text-2xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Uniting families, nurturing faith, and empowering generations for a prosperous and blessed future.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 bg-emerald-600 text-white rounded-full font-bold text-lg hover:bg-emerald-700 shadow-xl shadow-emerald-200 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center group"
            >
              Register Your Family
              <UserPlus className="ml-2 w-5 h-5 group-hover:scale-110 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-white text-slate-800 border border-slate-200 rounded-full font-bold text-lg hover:bg-slate-50 shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center justify-center group"
            >
              Login
              <LogIn className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Section 2: Features & Statistics */}
      <section className="bg-white py-24 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-sm font-bold tracking-widest text-emerald-600 uppercase mb-3">About Us</h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6">
              A Thriving Community
            </h3>
            <p className="text-lg text-slate-600 leading-relaxed">
              Chemmalil Mahall is a deeply rooted Islamic community focused on welfare, spiritual growth, and education. We provide robust facilities, including excellent madrasas and collegiate education, to mold the next generation. Our commitment is to ensure the prosperity and unity of all our member families.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col items-center text-center group cursor-default">
                <div className={`w-16 h-16 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-6`}>
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-4xl font-black text-slate-900 mb-2">{stat.value}</h4>
                <p className="text-slate-500 font-semibold tracking-wide uppercase text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Committee */}
      <section className="py-24 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold tracking-widest text-emerald-600 uppercase mb-3">Leadership</h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900">
              Mahall Committee
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
            {committee.map((member, idx) => (
              <div key={idx} className="bg-white rounded-3xl p-6 text-center border border-slate-100 shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-slate-100 overflow-hidden flex flex-col items-center justify-center border-4 border-emerald-50 relative">
                  {/* Image placeholder */}
                  <UserCircle className="w-16 h-16 text-slate-300" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-1">{member.name}</h4>
                <p className="text-emerald-600 font-medium text-sm bg-emerald-50 inline-block px-3 py-1 rounded-full">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Call to action */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 to-teal-900"></div>
        {/* Decorative pattern overlays */}
        <div className="absolute top-0 right-0 max-w-md opacity-10">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#ffffff" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.3,-46.3C90.8,-33.5,96.8,-18.1,97.1,-2.5C97.4,13.1,92,28.8,82.4,41.5C72.8,54.2,59,63.8,44.2,70.6C29.4,77.4,13.6,81.3,-2.3,84.5C-18.2,87.7,-34.5,90.2,-48.6,83.9C-62.7,77.6,-74.6,62.5,-82.7,46.1C-90.8,29.7,-95.1,12,-93.8,-5.3C-92.5,-22.6,-85.6,-39.5,-74.7,-52.6C-63.8,-65.7,-48.9,-75,-33.6,-80.7C-18.3,-86.4,-2.5,-88.4,12.2,-85.7C26.9,-83,41.9,-75.6,44.7,-76.4Z" transform="translate(100 100)" />
          </svg>
        </div>

        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center text-white">
          <h2 className="text-4xl md:text-6xl font-extrabold mb-6">
            Become the part of the Mahal
          </h2>
          <p className="text-lg md:text-xl text-emerald-100 mb-10 max-w-2xl mx-auto">
            Experience the harmony and support of our vibrant community. Register your family today and gain access to a host of valuable resources.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center px-10 py-5 bg-white text-emerald-900 rounded-full font-bold text-xl hover:bg-emerald-50 hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all duration-300"
          >
            Register Now
            <ArrowRight className="ml-3 w-6 h-6" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center space-x-2 mb-6 opacity-50">
            <Home className="w-5 h-5 text-emerald-500" />
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
              Chemmalil Mahall
            </span>
          </div>
          <p>© {new Date().getFullYear()} Chemmalil Mahall. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}