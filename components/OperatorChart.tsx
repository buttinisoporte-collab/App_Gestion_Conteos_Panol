import React from 'react';
import { WeekData } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';

export default function OperatorChart({ weeksData }: { weeksData: WeekData[] }) {
  const counts: Record<string, number> = {};

  weeksData.forEach(week => {
    week.items.forEach(item => {
      if (item.quantity !== null && item.countedBy) {
        // .trim() soluciona el problema de usuarios como "uprueba " vs "uprueba"
        const name = item.countedBy.trim();
        counts[name] = (counts[name] || 0) + 1;
      }
    });
  });

  const data = Object.keys(counts).map(name => ({
    name: name,
    Contados: counts[name]
  })).sort((a, b) => b.Contados - a.Contados);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Ítems Contados por Operario</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 12}} />
                <Tooltip cursor={{fill: '#f1f5f9'}} />
                <Bar dataKey="Contados" fill="#0033a0" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-center text-slate-500 py-8 text-sm">No hay datos de operarios para mostrar.</p>
        )}
      </CardContent>
    </Card>
  );
}