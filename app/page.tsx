'use client';

import React from 'react';
import Image from 'next/image';

const CHECK_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-notion-blue">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function LandingPage() {
  const scrollToForm = () => {
    document.getElementById('demo-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white text-notion-black selection:bg-notion-blue selection:text-white antialiased">
      {/* 🧭 NAVIGATION */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-whisper px-6 py-4 flex justify-between items-center max-w-[1440px] mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center text-white font-bold text-xl">I</div>
          <span className="text-lg font-bold tracking-tight">IntelDrop AI</span>
        </div>
        <div className="hidden md:flex gap-8 text-[15px] font-semibold text-warm-gray-500">
          <a href="#problem" className="hover:text-black transition-colors">The Problem</a>
          <a href="#solution" className="hover:text-black transition-colors">Our Solution</a>
          <a href="#security" className="hover:text-black transition-colors">Security</a>
        </div>
        <button 
          onClick={scrollToForm}
          className="bg-notion-blue text-white px-4 py-2 rounded-[4px] text-[15px] font-semibold hover:bg-[#005bab] transition-all transform active:scale-95 shadow-sm"
        >
          Request a Demo
        </button>
      </nav      <main className="selection:bg-notion-blue selection:text-white">
        {/* ⚡ HERO SECTION */}
        <section className="relative pt-20 pb-32 px-6 max-w-[1240px] mx-auto overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="z-10">
              <span className="inline-block bg-[#f2f9ff] text-[#097fe8] px-3 py-1 rounded-full text-[12px] font-bold tracking-[0.125px] mb-6 border border-[#a3daff]/30">
                AFRICA'S FIRST AI WHISTLEBLOWER SHIELD
              </span>
              <h1 className="text-5xl md:text-[64px] font-bold leading-[1.05] md:leading-[1] tracking-[-2.5px] mb-8 text-notion-black">
                The AI-Powered Secure Tip-Line for Investigative Teams
              </h1>
              <p className="text-xl md:text-2xl font-medium text-warm-gray-500 mb-10 leading-relaxed max-w-xl">
                Built for African newsrooms and watchdogs to gather high-stakes intelligence without exposing sources.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={scrollToForm}
                  className="bg-notion-blue text-white px-8 py-4 rounded-[4px] text-lg font-bold hover:bg-[#005bab] transition-all transform active:scale-95 shadow-md shadow-notion-blue/10"
                >
                  Request a Demo
                </button>
              </div>
            </div>
            <div className="relative aspect-square lg:aspect-auto h-[500px] w-full bg-warm-white rounded-[16px] overflow-hidden border border-whisper shadow-notion-deep transform lg:rotate-1 hover:rotate-0 transition-transform duration-700">
               <Image 
                src="/hero_intel_secure_1776148195777.png"
                alt="IntelDrop Secure Intelligence"
                fill
                className="object-cover grayscale hover:grayscale-0 transition-all duration-700 opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none" />
            </div>
          </div>
        </section>

        {/* 🚨 PROBLEM SECTION */}
        <section id="problem" className="bg-warm-white py-24 px-6 border-y border-whisper">
          <div className="max-w-[1200px] mx-auto text-center mb-16 px-4">
            <h2 className="text-4xl md:text-[48px] font-bold tracking-[-1.5px] mb-6 text-notion-black">The Crisis of Exposure</h2>
            <p className="text-xl text-warm-gray-500 max-w-2xl mx-auto font-medium opacity-80 italic">Traditional communication channels are the greatest vulnerability for modern whistleblowers.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-[1200px] mx-auto">
            {[
              { title: "Tip Line Spam", desc: "Critical leads are buried under thousands of irrelevant messages, delaying time-sensitive investigations." },
              { title: "Voice Note Risk", desc: "Stored audio files contain biometric signatures that can identify a source even after text is redacted." },
              { title: "Source Exposure", desc: "Metadata leaks from WhatsApp, Signal, or Email often point directly back to the investigative source." }
            ].map((p, i) => (
              <div key={i} className="bg-white p-10 rounded-[12px] border border-whisper shadow-notion-card hover:shadow-notion-deep hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 bg-notion-black text-white rounded-[8px] flex items-center justify-center font-bold text-2xl mb-6">!</div>
                <h3 className="text-[22px] font-bold tracking-[-0.5px] mb-4 text-notion-black">{p.title}</h3>
                <p className="text-warm-gray-500 leading-relaxed font-medium">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 🛠️ SOLUTION SECTION */}
        <section id="solution" className="py-24 px-6 bg-white">
          <div className="max-w-[1200px] mx-auto grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl md:text-[48px] font-bold tracking-[-1.5px] mb-8 text-notion-black">Intelligence, Redefined.</h2>
              <div className="space-y-10">
                {[
                  { title: "Automated AI Triage", desc: "Our engine separates truth from noise, categorizing tips and prioritizing high-priority leads instantly." },
                  { title: "Voice Incineration", desc: "Voice notes are transcribed in real-time. Audio files are destroyed forever before they reach any server." },
                  { title: "Zero-Identity Storage", desc: "Hardware-level encryption ensures no persistent mapping between intelligence and identity." }
                ].map((s, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="mt-1 flex-shrink-0">{CHECK_ICON}</div>
                    <div>
                      <h4 className="text-xl font-bold mb-2 text-notion-black tracking-tight">{s.title}</h4>
                      <p className="text-warm-gray-500 font-medium leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-warm-white border border-whisper rounded-[16px] p-2 aspect-square overflow-hidden shadow-notion-deep">
              <div className="bg-white h-full w-full rounded-[14px] border border-whisper p-10 text-sm overflow-hidden flex flex-col gap-4">
                <div className="flex gap-2 mb-4"><div className="w-3 h-3 rounded-full bg-red-400" /><div className="w-3 h-3 rounded-full bg-yellow-400" /><div className="w-3 h-3 rounded-full bg-green-400" /></div>
                <div className="h-4 bg-warm-white w-3/4 animate-pulse rounded-full" />
                <div className="h-4 bg-warm-white w-1/2 animate-pulse rounded-full" />
                <div className="border border-whisper p-6 bg-notion-blue/5 rounded-[8px] mt-6 flex flex-col gap-3">
                  <p className="text-notion-blue font-bold tracking-widest text-[11px] uppercase">AI Triage Output</p>
                  <p className="text-notion-black font-bold text-lg tracking-tight">Priority: High / Category: Financial Crime</p>
                  <p className="text-warm-gray-300 text-xs mt-2 italic font-medium">Source audio scrubbed: 2026-04-14 09:30:11</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 🛡️ SECURITY SECTION */}
        <section id="security" className="py-32 px-6 bg-notion-black text-white selection:bg-white selection:text-notion-black">
          <div className="max-w-[1240px] mx-auto">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div>
                <h2 className="text-[48px] font-bold tracking-[-1.5px] mb-8 leading-tight">Absolute Guarantees</h2>
                <div className="grid sm:grid-cols-2 gap-10 mt-12">
                  {[
                    { label: "Metadata Shredding", val: "All Exif data and source identifiers are stripped instantly upon submission." },
                    { label: "Voice Incineration", val: "Identifiable audio waveforms are destroyed immediately after AI transcription." },
                    { label: "Database Encryption", val: "AES-256-GCM hardware-level encryption secures all persisted intelligence." },
                    { label: "Automatic Purging", val: "Whistleblower conversation history is purged from all gateways upon report finalization." }
                  ].map((g, i) => (
                    <div key={i} className="border-l-[2px] border-notion-blue pl-6">
                      <h5 className="font-bold text-xl mb-2 text-white tracking-tight">{g.label}</h5>
                      <p className="text-white/50 text-[15px] font-medium leading-relaxed">{g.val}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white/5 p-1 rounded-[24px] border border-white/10 shadow-2xl">
                <div className="aspect-video bg-notion-blue px-10 flex flex-col justify-center items-center text-center rounded-[20px] shadow-inner">
                  <h6 className="text-[14px] font-bold uppercase tracking-[4px] mb-4 opacity-70">Security Protocol</h6>
                  <p className="text-6xl md:text-7xl font-bold tracking-[-3px] flex items-center gap-4">
                    100% SECURE
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ✉️ CTA FOOTER */}
        <section id="demo-form" className="py-32 px-6 bg-white flex flex-col items-center text-center">
          <h2 className="text-5xl md:text-[64px] font-bold tracking-[-2.5px] mb-8 text-notion-black">Ready to secure your newsroom?</h2>
          <p className="text-xl text-warm-gray-500 mb-12 max-w-2xl font-medium">IntelDrop is currently in selective deployment for professional investigative teams.</p>
          
          <div className="w-full max-w-[750px] bg-white border border-whisper rounded-[16px] shadow-notion-deep overflow-hidden">
            <div className="bg-warm-white px-6 py-4 border-b border-whisper text-left flex items-center justify-between">
              <span className="font-bold text-[11px] tracking-[0.125em] text-warm-gray-500 uppercase flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Encrypted Demo Gateway
              </span>
              <span className="opacity-20 text-[10px] font-bold tracking-widest text-notion-black">V4.2.0-STABLE</span>
            </div>
            <div className="p-16 flex flex-col items-center">
              <p className="text-warm-gray-500 font-medium mb-10 max-w-sm">Use our encrypted consultation request form to schedule a private security evaluation.</p>
              <a 
                href="https://tally.so/r/3yPjLp" 
                target="_blank" 
                className="bg-notion-blue text-white px-12 py-5 rounded-[4px] text-lg font-bold hover:bg-[#005bab] transition-all transform active:scale-95 shadow-lg shadow-notion-blue/20"
              >
                Launch Request Form
              </a>
              <p className="mt-10 text-[10px] text-warm-gray-300 uppercase font-bold tracking-[2px]">No public pricing · Professional inquiries only</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 px-6 border-t border-whisper bg-warm-white">
        <div className="max-w-[1240px] mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-notion-black rounded-sm flex items-center justify-center text-white font-bold text-xs">I</div>
            <span className="text-[14px] font-bold tracking-tight text-notion-black opacity-80 uppercase">IntelDrop AI © 2026</span>
          </div>
          <p className="text-[11px] font-bold text-warm-gray-300 uppercase tracking-[2px]">Branding: Minimalist / Security: Absolute</p>
        </div>
      </footer>
    </div>
  );
}
