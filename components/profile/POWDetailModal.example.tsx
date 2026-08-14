/**
 * POWDetailModal Example/Demo Page
 * This shows how to use the POWDetailModal component in a profile page
 */

'use client';

import { useState } from 'react';
import POWDetailModal from '@/components/profile/POWDetailModal';

export default function POWDetailModalExample() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Example user data
  const mockUser = {
    username: 'alexjones',
    score: 82,
    percentile: 78,
    band: 'Strong',
  };

  return (
    <div className="min-h-screen bg-zinc-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-zinc-100 mb-2">
          POW Detail Modal Example
        </h1>
        <p className="text-zinc-400 mb-8">
          Click the button below to see the full POW score breakdown modal
        </p>

        {/* Example Badge */}
        <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400 mb-1">Proof-of-Work Score</p>
              <p className="text-2xl font-bold text-emerald-400">
                {mockUser.score}/100 <span className="text-sm text-zinc-400">({mockUser.band})</span>
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
            >
              View Details
            </button>
          </div>
        </div>

        {/* Information */}
        <div className="bg-zinc-800/50 rounded-lg border border-zinc-700 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-zinc-100">About This Example</h2>
          <ul className="space-y-2 text-sm text-zinc-300">
            <li>✓ Displays a circular progress visualization</li>
            <li>✓ Shows 5 categories with color-coded breakdowns</li>
            <li>✓ Lists specific activities contributing to each category</li>
            <li>✓ Provides actionable improvement tips</li>
            <li>✓ Includes percentile ranking information</li>
            <li>✓ Fully responsive and accessible</li>
          </ul>
        </div>

        {/* Code Example */}
        <div className="bg-zinc-800/50 rounded-lg border border-zinc-700 p-6 mt-8">
          <h2 className="text-lg font-semibold text-zinc-100 mb-4">Usage</h2>
          <pre className="bg-zinc-900 p-4 rounded text-xs text-zinc-300 overflow-x-auto">
{`import POWDetailModal from '@/components/profile/POWDetailModal';
import { useState } from 'react';

export default function ProfilePage() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        View POW Details
      </button>

      <POWDetailModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        username="johndoe"
        score={82}
        percentile={78}
      />
    </>
  );
}`}
          </pre>
        </div>
      </div>

      {/* The actual modal */}
      <POWDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        username={mockUser.username}
        score={mockUser.score}
        percentile={mockUser.percentile}
      />
    </div>
  );
}
