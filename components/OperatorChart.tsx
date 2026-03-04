import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { WeekData, User } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

interface OperatorChartProps {
  weeksData: WeekData[];
  users: User[];
}

const OperatorChart: React.FC<OperatorChartProps> = ({ weeksData, users }) => {
  const operatorCounts: { [key: string]: number } = {};

  const getOperatorName = (fullName: string) => {
    const user = users.find(u => u.fullName === fullName);
    return user ? user.fullName : 'Desconocido';
  };

  weeksData.forEach(week => {
    week.items.forEach(item => {
      if (item.quantity !== null && item.quantity > 0 && item.auditLog) {
        const lastCountLog = item.auditLog
          .filter(log => log.field === 'quantity' && log.newValue !== null && log.newValue > 0)
          .pop();

        if (lastCountLog) {
          const operatorName = getOperatorName(lastCountLog.user);
          if (users.some(u => u.fullName === operatorName && u.role === 'operario')) {
            operatorCounts[operatorName] = (operatorCounts[operatorName] || 0) + 1;
          }
        }
      }
    });
  });

  const chartData = Object.keys(operatorCounts).map(operatorName => ({
    name: operatorName,
    'Ítems Contados': operatorCounts[operatorName],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ítems Contados por Operario</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Ítems Contados" fill="#3b82f6">
                <LabelList dataKey="Ítems Contados" position="top" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-slate-500">No hay datos de operarios para mostrar.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OperatorChart;
