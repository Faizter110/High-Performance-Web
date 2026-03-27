import React, { useState } from 'react';
import { useGetMatches, useCreateMatch, useGetQuestions, useCreateQuestion, useSyncFromSheets } from '@workspace/api-client-react';
import { Card, Button, Input, Label } from '@/components/ui';
import { useToast } from '@/hooks/use-toast';
import { LayoutDashboard, Users, Database, Plus, RefreshCw, Calendar as CalendarIcon, Play } from 'lucide-react';
import { Link, useLocation } from 'wouter';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'matches' | 'questions'>('matches');
  
  return (
    <div className="min-h-screen bg-background text-white p-6">
      <div className="max-w-7xl mx-auto">
        
        <header className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <LayoutDashboard className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>
              <p className="text-white/50">Manage tournaments, matches, and questions</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => window.location.href = '/'}>Back to Home</Button>
        </header>

        <div className="flex gap-6 mb-8">
          <Button 
            variant={activeTab === 'matches' ? 'default' : 'glass'} 
            onClick={() => setActiveTab('matches')}
            className="w-40"
          >
            <CalendarIcon className="w-4 h-4 mr-2" /> Matches
          </Button>
          <Button 
            variant={activeTab === 'questions' ? 'default' : 'glass'} 
            onClick={() => setActiveTab('questions')}
            className="w-40"
          >
            <Database className="w-4 h-4 mr-2" /> Questions
          </Button>
        </div>

        {activeTab === 'matches' && <MatchesPanel />}
        {activeTab === 'questions' && <QuestionsPanel />}

      </div>
    </div>
  );
}

function MatchesPanel() {
  const { data: matches, isLoading } = useGetMatches();
  const [, setLocation] = useLocation();
  const createMatch = useCreateMatch();
  const { toast } = useToast();

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMatch.mutate({
      data: {
        matchNumber: parseInt(fd.get('matchNumber') as string),
        redTeamName: fd.get('redTeam') as string,
        blueTeamName: fd.get('blueTeam') as string,
        boardSize: fd.get('boardSize') as string,
        round: fd.get('round') as string,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Match Created", description: "Ready to play!" });
        (e.target as HTMLFormElement).reset();
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="p-6 lg:col-span-1">
        <h2 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary" /> Create Match
        </h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label>Match Number</Label>
            <Input name="matchNumber" type="number" required defaultValue="1" />
          </div>
          <div className="space-y-2">
            <Label className="text-red-400">Red Team Name</Label>
            <Input name="redTeam" required placeholder="e.g. Al-Fatah" />
          </div>
          <div className="space-y-2">
            <Label className="text-blue-400">Blue Team Name</Label>
            <Input name="blueTeam" required placeholder="e.g. Al-Noor" />
          </div>
          <div className="space-y-2">
            <Label>Board Size</Label>
            <select name="boardSize" className="flex h-12 w-full rounded-xl border border-white/20 bg-black/40 px-4 py-2 text-sm text-white focus-visible:ring-2 focus-visible:ring-primary outline-none">
              <option value="5x5">5x5 (Standard)</option>
              <option value="3x3">3x3 (Quick)</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Round</Label>
            <Input name="round" placeholder="e.g. Quarter Finals" />
          </div>
          <Button type="submit" className="w-full" disabled={createMatch.isPending}>
            {createMatch.isPending ? "Creating..." : "Create Match"}
          </Button>
        </form>
      </Card>

      <Card className="p-6 lg:col-span-2">
        <h2 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" /> Match History
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-white/80">
            <thead className="text-xs text-white/50 uppercase bg-white/5">
              <tr>
                <th className="px-6 py-3 rounded-tl-lg">Match</th>
                <th className="px-6 py-3">Red Team</th>
                <th className="px-6 py-3">Blue Team</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-4">Loading...</td></tr>
              ) : matches?.map(m => (
                <tr key={m.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-6 py-4 font-bold">#{m.matchNumber}</td>
                  <td className="px-6 py-4 text-red-400 font-semibold">{m.redTeamName}</td>
                  <td className="px-6 py-4 text-blue-400 font-semibold">{m.blueTeamName}</td>
                  <td className="px-6 py-4">
                    <span className="bg-white/10 px-2 py-1 rounded text-xs">{m.status}</span>
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setLocation(`/host/${m.id}`)}>
                       Host
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setLocation(`/audience/${m.id}`)}>
                       Audience
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function QuestionsPanel() {
  const { data: questions, isLoading } = useGetQuestions();
  const syncSheets = useSyncFromSheets();
  const { toast } = useToast();

  const handleSync = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    syncSheets.mutate({
      data: { spreadsheetId: fd.get('sheetId') as string }
    }, {
      onSuccess: (res) => {
        toast({ title: "Sync Complete", description: res.message });
      },
      onError: () => {
        toast({ title: "Sync Failed", description: "Check spreadsheet ID and permissions.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="p-6 lg:col-span-1">
        <h2 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-green-400" /> Google Sheets Sync
        </h2>
        <p className="text-sm text-white/50 mb-4">
          Pull questions directly from a Google Sheet. Make sure the sheet is accessible.
        </p>
        <form onSubmit={handleSync} className="space-y-4">
          <div className="space-y-2">
            <Label>Spreadsheet ID</Label>
            <Input name="sheetId" required placeholder="1BxiMVs0XRYFgwnV..." />
            <p className="text-xs text-white/30 truncate">Found in the URL: docs.google.com/spreadsheets/d/.../edit</p>
          </div>
          <Button type="submit" variant="outline" className="w-full text-green-400 border-green-400/30 hover:bg-green-400/10" disabled={syncSheets.isPending}>
            {syncSheets.isPending ? "Syncing..." : "Start Sync"}
          </Button>
        </form>
      </Card>

      <Card className="p-6 lg:col-span-2">
         <h2 className="text-xl font-display font-bold mb-6">Question Bank ({questions?.length || 0})</h2>
         <div className="overflow-x-auto h-[500px] overflow-y-auto">
          <table className="w-full text-sm text-left text-white/80">
            <thead className="text-xs text-white/50 uppercase bg-white/5 sticky top-0">
              <tr>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Difficulty</th>
                <th className="px-6 py-3">Question</th>
                <th className="px-6 py-3">Answer</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={4} className="text-center py-4">Loading...</td></tr>
              ) : questions?.map(q => (
                <tr key={q.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-6 py-4 whitespace-nowrap">{q.category}</td>
                  <td className="px-6 py-4">
                    <span className="bg-white/10 px-2 py-1 rounded text-xs">{q.difficulty}</span>
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate" title={q.text}>{q.text}</td>
                  <td className="px-6 py-4 text-green-400">{q.answer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
