import React from 'react';
import { Link } from 'wouter';
import { Card, Button } from '@/components/ui';
import { MonitorPlay, Settings, UserCog, Users } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-red-team-glow rounded-full blur-[120px] opacity-30 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-blue-team-glow rounded-full blur-[120px] opacity-30 pointer-events-none" />
      
      <div className="z-10 text-center max-w-3xl w-full">
        <h1 className="text-6xl md:text-8xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-white to-blue-400 mb-4 drop-shadow-xl">
          BLOCKBUSTERS
        </h1>
        <p className="text-xl text-white/70 mb-12 font-medium">Professional Game Show System</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto">
          
          <Link href="/host">
            <Card className="p-8 hover:bg-white/10 hover:border-white/30 transition-all cursor-pointer group flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/20">
                <MonitorPlay className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-display font-bold text-white mb-2">Host View</h2>
              <p className="text-white/60">Interactive control, reveal questions, award blocks.</p>
            </Card>
          </Link>
          
          <Link href="/moderator">
            <Card className="p-8 hover:bg-white/10 hover:border-white/30 transition-all cursor-pointer group flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/20">
                <UserCog className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-display font-bold text-white mb-2">Moderator View</h2>
              <p className="text-white/60">Preview questions, override controls, manage flow.</p>
            </Card>
          </Link>
          
          <Link href="/audience">
            <Card className="p-8 hover:bg-white/10 hover:border-white/30 transition-all cursor-pointer group flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-orange-500/20">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-display font-bold text-white mb-2">Audience View</h2>
              <p className="text-white/60">Clean, full-screen board for projection/stream.</p>
            </Card>
          </Link>

          <Link href="/admin">
            <Card className="p-8 hover:bg-white/10 hover:border-white/30 transition-all cursor-pointer group flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-500 to-gray-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-slate-500/20">
                <Settings className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-display font-bold text-white mb-2">Admin / Setup</h2>
              <p className="text-white/60">Manage questions, tournaments, create matches.</p>
            </Card>
          </Link>

        </div>
      </div>
    </div>
  );
}
