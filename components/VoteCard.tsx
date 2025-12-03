import React from 'react';
import { Candidate } from '../types';
import { CheckCircle2 } from 'lucide-react';

interface VoteCardProps {
  candidate: Candidate;
  selected: boolean;
  onSelect: (id: string) => void;
}

export const VoteCard: React.FC<VoteCardProps> = ({ candidate, selected, onSelect }) => {
  return (
    <div
      onClick={() => onSelect(candidate.id)}
      className={`relative cursor-pointer group rounded-xl p-4 transition-all duration-300 border-2 ${
        selected
          ? 'border-indigo-600 bg-indigo-50 shadow-lg transform scale-[1.02]'
          : 'border-white bg-white hover:border-gray-300 shadow-sm hover:shadow-md'
      }`}
    >
      {selected && (
        <div className="absolute top-3 right-3 text-indigo-600">
          <CheckCircle2 size={24} fill="currentColor" className="text-white" />
        </div>
      )}
      
      <div className="flex items-center space-x-4">
        <img
          src={candidate.avatarUrl}
          alt={candidate.name}
          className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
        />
        <div>
          <h3 className="text-lg font-bold text-gray-900">{candidate.name}</h3>
          <span
            className="inline-block px-2 py-1 text-xs font-semibold rounded-full text-white mt-1"
            style={{ backgroundColor: candidate.color }}
          >
            {candidate.party}
          </span>
        </div>
      </div>
    </div>
  );
};
