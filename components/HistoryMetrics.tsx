import React from 'react';
import { CountCycle, WeekData } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';

interface HistoryMetricsProps {
  historicalCounts: CountCycle[];
}

const calculateMetrics = (weeks: WeekData[]) => {
  let totalItems = 0;
  let countedItems = 0;
  let deviationItems = 0;

  weeks.forEach(week => {
    totalItems += week.items.length;
    week.items.forEach(item => {
      if (item.quantity !== null) {
        countedItems++;
        if (item.systemStock !== item.quantity) {
          deviationItems++;
        }
      }
    });
  });

  const compliance = totalItems > 0 ? (countedItems / totalItems) * 100 : 0;
  const deviation = countedItems > 0 ? (deviationItems / countedItems) * 100 : 0;

  return { compliance, deviation };
};

const HistoryMetrics: React.FC<HistoryMetricsProps> = ({ historicalCounts }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {historicalCounts.map(count => {
        const { compliance, deviation } = calculateMetrics(count.weeks);
        return (
          <Card key={count.id}>
            <CardHeader>
              <CardTitle>{count.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium">% Cumplimiento Total:</p>
                <p className="text-lg font-bold">{compliance.toFixed(2)}%</p>
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm font-medium">% Desvíos Detectados:</p>
                <p className="text-lg font-bold">{deviation.toFixed(2)}%</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default HistoryMetrics;
