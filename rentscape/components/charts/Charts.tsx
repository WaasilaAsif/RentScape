"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ['#0474C4', '#0D47A1', '#1976D2', '#42A5F5', '#64B5F6'];

interface MonthlyRevenueChartProps {
  data: Array<{ month: string; revenue: number }>;
}

export function MonthlyRevenueChart({ data }: MonthlyRevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E0E7FF" />
        <XAxis dataKey="month" stroke="#6366F1" />
        <YAxis stroke="#6366F1" />
        <Tooltip 
          contentStyle={{
            backgroundColor: '#F0F9FF',
            border: '2px solid #0474C4',
            borderRadius: '8px'
          }}
          cursor={{ fill: 'rgba(4, 116, 196, 0.1)' }}
        />
        <Legend />
        <Bar dataKey="revenue" fill="#0474C4" radius={[8, 8, 0, 0]} name="Revenue" />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface PropertyTypesChartProps {
  data: Array<{ type: string; count: number }>;
}

export function PropertyTypesChart({ data }: PropertyTypesChartProps) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, value }) => `${name}: ${value}`}
          outerRadius={90}
          fill="#0474C4"
          dataKey="count"
          nameKey="type" 
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{
            backgroundColor: '#F0F9FF',
            border: '2px solid #0474C4',
            borderRadius: '8px'
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}