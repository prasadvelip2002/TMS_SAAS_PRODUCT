import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* Navigation Bar */}
      <nav className="w-full bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Image src="/logo.png" alt="Transitflow LOGISTICS" width={240} height={60} className="h-14 w-auto object-contain mix-blend-multiply" />
            </div>
            
            {/* Nav Links (Desktop) */}
            <div className="hidden md:flex space-x-8 items-center">
              <Link href="#" className="text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors">Home</Link>
              <Link href="#" className="text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors">Solutions</Link>
              <Link href="#" className="text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors">Features</Link>
              <Link href="#" className="text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors">Pricing</Link>
              <Link href="#" className="text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors">Contact</Link>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-slate-700 hover:text-slate-900 font-bold text-sm px-4 py-2 border border-slate-300 rounded-full hover:bg-slate-50 transition-all">
                Login
              </Link>
              <Link href="/register" className="bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-bold text-sm px-6 py-2.5 rounded-full shadow-[0_4px_14px_0_rgba(234,88,12,0.39)] transition-all flex items-center gap-2">
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow">
        <div className="relative pt-20 pb-32 overflow-hidden">
          
          {/* Decorative Background */}
          <div className="absolute inset-0 bg-slate-900">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519003722824-194d4455a60c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2075&q=80')] bg-cover bg-center mix-blend-overlay opacity-30"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/90"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-8 leading-tight max-w-4xl mx-auto">
              Transport Management Software <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-red-500">for Modern Logistics in India</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-300 font-medium mb-12 max-w-3xl mx-auto leading-relaxed">
              All-in-one SaaS platform to simplify digital indents, dispatch planning, fleet tracking, vendor billing, and profitability analysis.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="w-full sm:w-auto bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-bold text-lg px-8 py-4 rounded-full shadow-[0_4px_20px_0_rgba(234,88,12,0.5)] transition-all flex items-center justify-center gap-2">
                Start 7-Day Free Trial <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="#" className="w-full sm:w-auto bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 font-bold text-lg px-8 py-4 rounded-full transition-all flex items-center justify-center gap-2">
                Watch Demo <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center"><div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-white border-b-[4px] border-b-transparent ml-0.5"></div></div>
              </Link>
            </div>
            
            <div className="mt-12 flex items-center justify-center gap-8 text-slate-300 text-sm font-semibold">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-400"/> No credit card required</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-400"/> Setup in 2 minutes</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-400"/> Free Mobile App</div>
            </div>
          </div>
        </div>
        
        {/* Features Preview Section */}
        <div className="bg-white py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-12">Trusted by 500+ Transporters & Fleet Owners</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 text-2xl">🚚</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Trip & Fleet Management</h3>
                <p className="text-slate-600 leading-relaxed">End-to-end trip lifecycle from indent creation to POD collection. Track your own fleet and market vehicles on a single dashboard.</p>
              </div>
              
              <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6 text-2xl">💸</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Billing & Accounting</h3>
                <p className="text-slate-600 leading-relaxed">Generate GST-compliant invoices instantly. Manage driver advances, vendor settlements, and track trip-level profitability automatically.</p>
              </div>
              
              <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="w-14 h-14 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mb-6 text-2xl">📱</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Driver Mobile App</h3>
                <p className="text-slate-600 leading-relaxed">Free Android & iOS app for your drivers to upload documents, receive trip alerts, and manage their earnings on the go.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 py-12 text-center text-slate-400 text-sm">
        <p>&copy; {new Date().getFullYear()} Transitflow Logistics SaaS. All rights reserved.</p>
      </footer>
    </div>
  );
}
