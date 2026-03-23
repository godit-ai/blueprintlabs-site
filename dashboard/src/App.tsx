import React, { useState } from 'react';
import type { TabId } from './types';
import Navbar from './components/Navbar';
import OverviewTab from './components/tabs/OverviewTab';
import MemoryTab from './components/tabs/MemoryTab';
import CacheTab from './components/tabs/CacheTab';
import TestingTab from './components/tabs/TestingTab';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="pt-20 pb-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'memory' && <MemoryTab />}
          {activeTab === 'cache' && <CacheTab />}
          {activeTab === 'testing' && <TestingTab />}
        </div>
      </main>
    </div>
  );
}
