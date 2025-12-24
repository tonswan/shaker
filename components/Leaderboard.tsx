
import React from 'react';
import { ScoreEntry, GameMode } from '../types';

interface LeaderboardProps {
  scores: ScoreEntry[];
  onBack: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ scores, onBack }) => {
  const [filter, setFilter] = React.useState<GameMode | 'ALL'>('ALL');

  const filteredScores = scores
    .filter(s => filter === 'ALL' || s.mode === filter)
    .sort((a, b) => b.score - a.score);

  return (
    <div className="flex flex-col h-full p-6 animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Лидерборд</h2>
        <button 
          onClick={onBack}
          className="bg-slate-700 px-4 py-2 rounded-lg text-sm"
        >
          Назад
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
        {(['ALL', ...Object.values(GameMode)] as const).map(m => (
          <button
            key={m}
            onClick={() => setFilter(m)}
            className={`px-4 py-1 rounded-full text-xs whitespace-nowrap border transition-all ${
              filter === m ? 'bg-white text-slate-900 border-white' : 'bg-transparent border-white/30'
            }`}
          >
            {m === 'ALL' ? 'Все' : m}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {filteredScores.length > 0 ? (
          filteredScores.map((entry, i) => (
            <div 
              key={`${entry.username}-${entry.date}`}
              className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10"
            >
              <div className="flex items-center gap-4">
                <span className={`text-lg font-bold w-6 ${i < 3 ? 'text-yellow-400' : 'text-slate-400'}`}>
                  #{i + 1}
                </span>
                <div>
                  <p className="font-semibold">{entry.username}</p>
                  <p className="text-xs text-slate-400">{entry.mode} • {new Date(entry.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-white">{entry.score.toLocaleString()}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 text-slate-500">Пока результатов нет</div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
