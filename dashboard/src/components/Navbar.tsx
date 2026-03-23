import React from 'react';
import type { TabId } from '../types';
import { BarChart3, Brain, Database, FlaskConical } from 'lucide-react';

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <BarChart3 size={18} /> },
  { id: 'memory', label: 'Object Memory', icon: <Brain size={18} /> },
  { id: 'cache', label: 'Prefix Cache', icon: <Database size={18} /> },
  { id: 'testing', label: 'Live Testing', icon: <FlaskConical size={18} /> },
];

interface NavbarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export default function Navbar({ activeTab, onTabChange }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/90 backdrop-blur-xl border-b border-dark-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-lg flex items-center justify-center text-white font-bold text-sm">
                B
              </div>
              <span className="font-bold text-dark-50 text-lg hidden sm:block">Blueprint Labs</span>
            </a>
            <span className="text-dark-500 hidden sm:block">/</span>
            <span className="gradient-text font-semibold text-sm sm:text-base">PMI Dashboard</span>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-brand-primary/15 text-brand-primary'
                    : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800'
                }`}
              >
                {tab.icon}
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-brand-success">
              <span className="w-2 h-2 rounded-full bg-brand-success animate-pulse" />
              <span className="hidden sm:inline">Live</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
