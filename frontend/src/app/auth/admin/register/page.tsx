"use client";
import Link from 'next/link';

export default function AdminRegisterPage() {
  return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-4 font-sans selection:bg-orange-500 selection:text-white">
      
      {/* Background Circle Element from Image */}
      <div className="fixed top-[-150px] left-[-100px] w-[500px] h-[550px] bg-[#FF8A00] rounded-full opacity-100 z-0"></div>

      <div className="relative z-10 w-full max-w-[400px] bg-white rounded-[45px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] p-10 flex flex-col items-center animate-reveal">
         
         <div className="w-full flex flex-col items-center mb-10">
            <h1 className="text-[32px] font-black text-[#38416E] mb-1">Register</h1>
            <p className="text-[15px] font-black text-[#38416E] opacity-70">Let's Get Started</p>
         </div>

         <form className="w-full space-y-8">
            <div className="relative border-b-2 border-slate-100 focus-within:border-orange-400 transition-colors">
               <label htmlFor="fullName" className="text-[11px] font-black uppercase text-slate-400 block mb-1 uppercase tracking-widest">Full Name</label>
               <input 
                  id="fullName"
                  type="text" 
                  placeholder="John Doe" 
                  className="w-full py-2 bg-transparent text-sm font-bold text-slate-700 outline-none placeholder:text-slate-200" 
               />
            </div>

            <div className="relative border-b-2 border-slate-100 focus-within:border-orange-400 transition-colors">
               <label htmlFor="email" className="text-[11px] font-black uppercase text-slate-400 block mb-1 uppercase tracking-widest">Email</label>
               <input 
                  id="email"
                  type="email" 
                  placeholder="example@gmail.com" 
                  className="w-full py-2 bg-transparent text-sm font-bold text-slate-700 outline-none placeholder:text-slate-200" 
               />
            </div>

            <div className="relative border-b-2 border-slate-100 focus-within:border-orange-400 transition-colors">
               <label htmlFor="phone" className="text-[11px] font-black uppercase text-slate-400 block mb-1 uppercase tracking-widest">Phone Number</label>
               <input 
                  id="phone"
                  type="text" 
                  placeholder="+1 234 567 89" 
                  className="w-full py-2 bg-transparent text-sm font-bold text-slate-700 outline-none placeholder:text-slate-200" 
               />
            </div>

            <button className="w-full bg-[#FF8A00] text-white py-5 rounded-[22px] font-black text-[15px] shadow-[0_15px_30px_rgba(255,138,0,0.2)] flex items-center justify-center mt-12 hover:scale-[1.02] active:scale-95 transition-all">
               Register
            </button>

            <div className="text-center mt-8 pb-2">
               <p className="text-[11px] font-bold text-slate-400 italic">
                  Already have account? <Link href="/auth/admin/login" className="text-orange-500 font-extrabold cursor-pointer">Sign in</Link>
               </p>
            </div>
         </form>
      </div>

      <div className="fixed bottom-[-60px] right-[-60px] w-40 h-40 bg-black/5 rounded-full z-0"></div>
    </div>
  );
}
