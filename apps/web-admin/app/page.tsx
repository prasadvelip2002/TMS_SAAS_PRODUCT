import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Navigation, Route, FileText, BarChart3, Users, Smartphone, ShieldCheck, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col selection:bg-blue-200 overflow-x-hidden">
      
      {/* 🌟 Navigation Bar */}
      <nav className="w-full bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center group cursor-pointer">
              <Image src="/logo.png" alt="Transitflow LOGISTICS" width={320} height={80} className="h-14 md:h-16 w-auto object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105" />
            </div>
            
            {/* Nav Links */}
            <div className="hidden md:flex space-x-10 items-center">
              <Link href="#features" className="text-slate-600 hover:text-blue-600 font-semibold text-[15px] transition-colors">Features</Link>
              <Link href="#how-it-works" className="text-slate-600 hover:text-blue-600 font-semibold text-[15px] transition-colors">How it Works</Link>
              <Link href="#metrics" className="text-slate-600 hover:text-blue-600 font-semibold text-[15px] transition-colors">Why Us</Link>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-2 md:space-x-4">
              <Link href="/login" className="hidden sm:block text-slate-600 hover:text-slate-900 font-bold text-sm md:text-[15px] px-3 md:px-5 py-2.5 rounded-full hover:bg-slate-100 transition-all">
                Sign In
              </Link>
              <Link href="/register" className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm md:text-[15px] px-4 md:px-7 py-2 md:py-2.5 rounded-full shadow-[0_8px_20px_rgb(37,99,235,0.25)] hover:shadow-[0_8px_25px_rgb(37,99,235,0.4)] hover:-translate-y-0.5 transition-all flex items-center gap-1 md:gap-2">
                Start Free <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 🚀 Hero Section */}
      <main className="flex-grow">
        <div className="relative pt-24 pb-40 overflow-hidden bg-[#0F172A]">
          {/* Futuristic Background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center opacity-20"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/80 via-[#0F172A]/90 to-[#0F172A]"></div>
            
            {/* Glowing Orbs */}
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
            {/* Beta Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 font-semibold text-sm mb-8">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
              TransitFlow v2.0 is Live
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-8 leading-[1.1] max-w-5xl mx-auto">
              The Intelligent OS for <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400">
                Modern Transport & Logistics
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-400 font-medium mb-12 max-w-3xl mx-auto leading-relaxed">
              Unify your 2PL fleet and 3PL vendor operations. Automate indents, track shipments in real-time, generate GST invoices, and calculate profitability instantly.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <Link href="/register" className="w-full sm:w-auto bg-gradient-to-r from-[#2563EB] to-[#4F46E5] hover:from-[#1D4ED8] hover:to-[#4338CA] text-white font-bold text-lg px-10 py-4 rounded-full shadow-[0_8px_30px_rgb(37,99,235,0.4)] hover:shadow-[0_12px_40px_rgb(37,99,235,0.6)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 border border-blue-400/20">
                Start 7-Day Free Trial <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="#features" className="w-full sm:w-auto bg-white/5 hover:bg-white/10 backdrop-blur-md text-white border border-slate-700 font-bold text-lg px-10 py-4 rounded-full transition-all duration-300 flex items-center justify-center gap-3">
                Explore Features
              </Link>
            </div>
            
            <div className="mt-10 md:mt-14 flex flex-wrap items-center justify-center gap-x-4 md:gap-x-10 gap-y-4 text-slate-300 text-sm md:text-[15px] font-semibold">
              <div className="flex items-center gap-1.5 md:gap-2"><CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-400"/> Zero Setup Fees</div>
              <div className="flex items-center gap-1.5 md:gap-2"><CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-400"/> 2PL & 3PL Support</div>
              <div className="flex items-center gap-1.5 md:gap-2"><CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-400"/> Mobile App for Drivers</div>
            </div>
          </div>
        </div>
        
        {/* ✨ Features Grid */}
        <div id="features" className="bg-slate-50 py-20 md:py-32 relative -mt-6 md:-mt-10 rounded-t-3xl md:rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.2)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 md:mb-20">
              <h2 className="text-blue-600 font-bold tracking-wider uppercase text-sm mb-3">Why TransitFlow?</h2>
              <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Everything you need to scale</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
              
              {/* Feature 1 */}
              <div className="p-10 rounded-[2rem] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(37,99,235,0.12)] hover:-translate-y-1 transition-all duration-300 group">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                  <Route strokeWidth={2.5} className="w-8 h-8" />
                </div>
                <h4 className="text-2xl font-bold text-slate-900 mb-4">Dynamic Routing</h4>
                <p className="text-slate-600 leading-relaxed text-[17px]">Intelligently handle direct routes, round trips, and multi-leg hub-and-spoke models for both your own fleet and external vendors.</p>
              </div>

              {/* Feature 2 */}
              <div className="p-10 rounded-[2rem] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(16,185,129,0.12)] hover:-translate-y-1 transition-all duration-300 group">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                  <FileText strokeWidth={2.5} className="w-8 h-8" />
                </div>
                <h4 className="text-2xl font-bold text-slate-900 mb-4">Automated Billing</h4>
                <p className="text-slate-600 leading-relaxed text-[17px]">Generate beautiful, GST-compliant invoices instantly. Automatically calculate margins between customer revenue and supplier expenses.</p>
              </div>

              {/* Feature 3 */}
              <div className="p-10 rounded-[2rem] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(139,92,246,0.12)] hover:-translate-y-1 transition-all duration-300 group">
                <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                  <Smartphone strokeWidth={2.5} className="w-8 h-8" />
                </div>
                <h4 className="text-2xl font-bold text-slate-900 mb-4">Driver Mobile App</h4>
                <p className="text-slate-600 leading-relaxed text-[17px]">A free, native Android & iOS app for drivers to scan PODs, request fuel advances, and update statuses in real-time.</p>
              </div>

              {/* Feature 4 */}
              <div className="p-10 rounded-[2rem] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(249,115,22,0.12)] hover:-translate-y-1 transition-all duration-300 group">
                <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-orange-600 group-hover:text-white transition-colors duration-300">
                  <BarChart3 strokeWidth={2.5} className="w-8 h-8" />
                </div>
                <h4 className="text-2xl font-bold text-slate-900 mb-4">Fleet Analytics</h4>
                <p className="text-slate-600 leading-relaxed text-[17px]">Interactive dashboards showing trip profitability, vehicle utilization, outstanding balances, and driver performance.</p>
              </div>

              {/* Feature 5 */}
              <div className="p-10 rounded-[2rem] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(14,165,233,0.12)] hover:-translate-y-1 transition-all duration-300 group">
                <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-sky-600 group-hover:text-white transition-colors duration-300">
                  <Zap strokeWidth={2.5} className="w-8 h-8" />
                </div>
                <h4 className="text-2xl font-bold text-slate-900 mb-4">Smart Indenting</h4>
                <p className="text-slate-600 leading-relaxed text-[17px]">Create indents in seconds. The system auto-fills rates from customer contracts and helps you dispatch vehicles faster than ever.</p>
              </div>

              {/* Feature 6 */}
              <div className="p-10 rounded-[2rem] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(99,102,241,0.12)] hover:-translate-y-1 transition-all duration-300 group">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                  <ShieldCheck strokeWidth={2.5} className="w-8 h-8" />
                </div>
                <h4 className="text-2xl font-bold text-slate-900 mb-4">Enterprise Security</h4>
                <p className="text-slate-600 leading-relaxed text-[17px]">Built on a multi-tenant architecture ensuring complete data isolation, role-based access control, and bank-grade encryption.</p>
              </div>
              
            </div>
          </div>
        </div>

        {/* 🔄 How It Works */}
        <div id="how-it-works" className="bg-white py-20 md:py-32 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-blue-600 font-bold tracking-wider uppercase text-sm mb-3">Workflow</h2>
            <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-12 md:mb-20">Logistics simplified in 4 steps</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
              {/* Connecting Line */}
              <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-1 bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 rounded-full z-0"></div>

              {/* Step 1 */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-24 h-24 bg-white border-4 border-blue-50 text-blue-600 rounded-full flex items-center justify-center text-3xl font-black shadow-xl mb-6 hover:scale-110 transition-transform">1</div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">Create Indent</h4>
                <p className="text-slate-600">Enter customer requirements, route, and negotiated rates.</p>
              </div>

              {/* Step 2 */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-24 h-24 bg-white border-4 border-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-3xl font-black shadow-xl mb-6 hover:scale-110 transition-transform">2</div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">Assign Fleet</h4>
                <p className="text-slate-600">Allocate to your own vehicles (2PL) or outsource to vendors (3PL).</p>
              </div>

              {/* Step 3 */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-24 h-24 bg-white border-4 border-purple-50 text-purple-600 rounded-full flex items-center justify-center text-3xl font-black shadow-xl mb-6 hover:scale-110 transition-transform">3</div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">Track & Upload</h4>
                <p className="text-slate-600">Monitor location and receive digital PODs via the driver app.</p>
              </div>

              {/* Step 4 */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-24 h-24 bg-white border-4 border-orange-50 text-orange-600 rounded-full flex items-center justify-center text-3xl font-black shadow-xl mb-6 hover:scale-110 transition-transform">4</div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">Invoice & Settle</h4>
                <p className="text-slate-600">Auto-generate customer invoices and process vendor payouts.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 📈 Metrics / Social Proof */}
        <div id="metrics" className="bg-[#0F172A] py-24 border-y border-slate-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-900/10 mix-blend-color-dodge"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-slate-800">
              <div className="p-4 hover:scale-105 transition-transform duration-300">
                <div className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mb-2">₹500Cr+</div>
                <div className="text-slate-400 font-medium text-sm md:text-lg">Freight Managed</div>
              </div>
              <div className="p-4 hover:scale-105 transition-transform duration-300">
                <div className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 mb-2">50,000+</div>
                <div className="text-slate-400 font-medium text-sm md:text-lg">Trips Completed</div>
              </div>
              <div className="p-4 hover:scale-105 transition-transform duration-300">
                <div className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">99.9%</div>
                <div className="text-slate-400 font-medium text-sm md:text-lg">Uptime Reliability</div>
              </div>
              <div className="p-4 hover:scale-105 transition-transform duration-300">
                <div className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400 mb-2">500+</div>
                <div className="text-slate-400 font-medium text-sm md:text-lg">Fleet Owners</div>
              </div>
            </div>
          </div>
        </div>

        {/* 🎯 CTA Section */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 py-20 md:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-3xl md:text-6xl font-black text-white mb-6 md:mb-8 tracking-tight">Ready to transform your transport business?</h2>
            <p className="text-lg md:text-xl text-blue-100 mb-8 md:mb-12 font-medium">Join hundreds of logistics companies upgrading their operations with TransitFlow today.</p>
            <Link href="/register" className="inline-flex items-center justify-center gap-2 md:gap-3 bg-white text-blue-700 hover:bg-blue-50 font-black text-lg md:text-xl px-8 md:px-12 py-4 md:py-5 rounded-full shadow-2xl hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] hover:-translate-y-1 transition-all duration-300">
              Create Your Free Account <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
            </Link>
          </div>
        </div>

      </main>

      {/* 🏁 Footer */}
      <footer className="bg-[#0B1120] pt-20 pb-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
            <Image src="/logo.png" alt="Transitflow LOGISTICS" width={200} height={50} className="h-10 w-auto object-contain brightness-0 invert opacity-80" />
            <div className="flex space-x-6 text-slate-400 font-medium">
              <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="#" className="hover:text-white transition-colors">Support</Link>
            </div>
          </div>
          <div className="text-center text-slate-500 text-sm border-t border-slate-800 pt-8">
            &copy; {new Date().getFullYear()} Transitflow Logistics SaaS. Built for the modern supply chain. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
