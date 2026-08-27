"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

export default function RegisterPage() {
  const [tenantName, setTenantName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Clear any old session data when landing on the register page
  // This prevents the middleware from auto-redirecting to an old user's dashboard
  useEffect(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "isLoggedIn=; path=/; max-age=0";
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5063/api";
      const response = await fetch(`${apiUrl}/auth/setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          tenantName,
          companyName,
          adminName,
          adminPhone,
          adminEmail,
          adminPassword
        }),
      });

      if (response.ok) {
        toast.success("Account created successfully! Please log in.");
        router.push("/login");
      } else {
        toast.error("Failed to create account. Please try again.");
      }
    } catch (error) {
      toast.error("An error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex w-full font-sans bg-slate-50 overflow-hidden">
      {/* Left side - Dark Theme Hero */}
      <div className="hidden lg:flex flex-col w-1/2 bg-[#0F172A] text-white p-12 relative overflow-hidden h-full">
        
        {/* Background Image of Moving Vehicle */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center opacity-80 hover:scale-105 transition-transform duration-[20s] ease-linear"></div>
        
        {/* Gradient Overlays for Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/40 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/80 to-transparent/30"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#2563EB] opacity-30 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 opacity-30 blur-[100px] rounded-full -translate-x-1/3 translate-y-1/3" />

        <div className="flex-1 flex flex-col justify-center max-w-xl relative z-10 mx-auto text-center items-center">
          <div className="relative mb-12 -translate-y-12">
            <div className="absolute inset-0 bg-white/70 blur-[80px] rounded-full scale-150"></div>
            <Image src="/logo.png" alt="Transitflow LOGISTICS" width={600} height={180} className="relative z-10 h-40 w-auto object-contain drop-shadow-2xl" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6 tracking-tight text-white drop-shadow-lg">
            Start your journey with Transitflow Logistics
          </h1>
          <p className="text-[#94A3B8] text-lg mb-12 font-medium leading-relaxed">
            Create your workspace in seconds. Onboard your fleet, invite your team, and take control of your transport operations.
          </p>
          <div className="flex items-center gap-4 text-sm font-medium text-gray-300">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-[#1E293B] bg-gray-700 flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800" />
                </div>
              ))}
            </div>
            <span>Join 500+ transport companies growing with us</span>
          </div>
        </div>
      </div>

      {/* Right side - Registration Form */}
      <div className="flex-1 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-20 xl:px-24 bg-slate-50/50 text-ink overflow-y-auto relative h-full">
        {/* Decorative elements behind the card */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-indigo-100 rounded-full blur-3xl opacity-50 pointer-events-none" />

        <div className="mx-auto w-full max-w-md bg-white p-8 sm:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_8px_40px_rgb(37,99,235,0.12)] hover:border-blue-200 transition-all duration-500 relative z-10 my-auto">
          <div className="text-center lg:text-left mb-10 mt-8 lg:mt-0">
            <div className="lg:hidden flex items-center justify-center h-28 mb-8">
              <Image src="/logo.png" alt="Transitflow LOGISTICS" width={300} height={120} className="h-full w-auto max-w-[250px] object-contain mix-blend-multiply" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Create workspace</h2>
            <p className="mt-2 text-sm text-slate-600">
              Set up your company details to get started
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="adminName" className="text-sm font-medium text-slate-700">Full Name</Label>
                <div className="relative">
                  <Input 
                    id="adminName" 
                    type="text" 
                    placeholder="John Doe"
                    required 
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="block w-full px-4 py-3 text-[15px] border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none transition-all text-slate-700 bg-slate-50/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email Address</Label>
                <div className="relative">
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="john@example.com"
                    required 
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="block w-full px-4 py-3 text-[15px] border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none transition-all text-slate-700 bg-slate-50/50"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminPhone" className="text-sm font-medium text-slate-700">Phone Number</Label>
              <div className="relative">
                <Input 
                  id="adminPhone" 
                  type="tel" 
                  placeholder="Enter 10 digit phone number"
                  required 
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  className="block w-full px-4 py-3 text-[15px] border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none transition-all text-slate-700 bg-slate-50/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="tenantName" className="text-sm font-medium text-slate-700">Workspace Name</Label>
                <div className="relative">
                  <Input 
                    id="tenantName" 
                    type="text" 
                    placeholder="e.g. Acme Corp"
                    required 
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    className="block w-full px-4 py-3 text-[15px] border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none transition-all text-slate-700 bg-slate-50/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-sm font-medium text-slate-700">Company Legal Name</Label>
                <div className="relative">
                  <Input 
                    id="companyName" 
                    type="text" 
                    placeholder="Acme Logistics Pvt Ltd"
                    required 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="block w-full px-4 py-3 text-[15px] border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none transition-all text-slate-700 bg-slate-50/50"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">Admin Password</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type="password"
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  required 
                  minLength={6}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="block w-full px-4 py-3 text-[15px] border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none transition-all text-slate-700 bg-slate-50/50"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Must be at least 6 characters long.</p>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold py-3.5 px-4 rounded-xl shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 disabled:opacity-70 text-[15px] mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating workspace...
                </span>
              ) : "Create Workspace"}
            </button>
            
            <p className="text-xs text-center text-slate-500 mt-4">
              By creating an account, you agree to our <Link href="#" className="text-slate-700 hover:underline">Terms of Service</Link> and <Link href="#" className="text-slate-700 hover:underline">Privacy Policy</Link>.
            </p>
          </form>

          <div className="mt-8 text-center text-[14px] text-slate-500 font-medium pb-8 lg:pb-0">
            Already have an account?{" "}
            <Link href="/login" className="text-[#2563EB] font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
