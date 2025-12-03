import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Vote, Candidate } from '../types';
import { CANDIDATES } from '../constants';

interface ResultsViewProps {
  votes: Vote[];
}

export const ResultsView: React.FC<ResultsViewProps> = ({ votes }) => {
  // Aggregate votes
  const data = CANDIDATES.map(candidate => {
    const count = votes.filter(v => v.candidateId === candidate.id).length;
    return {
      name: candidate.name,
      shortName: candidate.name.split(' ')[0],
      votes: count,
      color: candidate.color,
      party: candidate.party
    };
  }).sort((a, b) => b.votes - a.votes);

  const totalVotes = votes.length;

  if (totalVotes === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-200">
        <p className="text-lg">No hay votos registrados aún.</p>
        <p className="text-sm">Comienza a registrar votos en la pestaña "Votar".</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium uppercase">Total Votos</p>
          <p className="text-4xl font-bold text-gray-900 mt-2">{totalVotes.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 md:col-span-2">
          <p className="text-sm text-gray-500 font-medium uppercase mb-2">Líder Actual</p>
          {data[0].votes > 0 ? (
            <div className="flex items-center gap-3">
               <div className="w-3 h-12 rounded-full" style={{ backgroundColor: data[0].color }}></div>
               <div>
                 <p className="text-2xl font-bold text-gray-900">{data[0].name}</p>
                 <p className="text-gray-600">{data[0].party}</p>
               </div>
               <div className="ml-auto text-2xl font-bold text-gray-400">
                 {((data[0].votes / totalVotes) * 100).toFixed(1)}%
               </div>
            </div>
          ) : (
            <p className="text-gray-400 italic">Esperando datos...</p>
          )}
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Conteo General</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="shortName" tick={{ fill: '#4b5563' }} width={80} />
              <Tooltip 
                cursor={{fill: 'transparent'}}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="votes" radius={[0, 4, 4, 0]} barSize={32}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Distribución Porcentual</h3>
        <div className="h-64 w-full flex justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="votes"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
