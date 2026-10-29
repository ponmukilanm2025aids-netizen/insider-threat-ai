import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, IndianRupee, Calendar, CheckCircle2, Award, Download } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { apiService } from '../../services/api';

const COLORS = ['#244C3A', '#66856A', '#B99756', '#BD6B46'];

export const ReportsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await apiService.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    alert('Exporting clinical and revenue audit report to CSV format...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#244C3A]" style={{ fontFamily: 'Georgia, serif' }}>
            Reports & Clinical Analytics
          </h1>
          <p className="text-xs sm:text-sm text-[#73695E] mt-0.5">
            Operational KPIs, therapy completion metrics, therapist utilization, and revenue performance
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#FAF7EF] hover:bg-[#F5EFEB] border border-[#B99756] text-[#8F6F33] text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Download size={16} /> Export Audit Report (CSV)
        </button>
      </div>

      {loading ? (
        <p className="text-center py-12 text-xs text-[#73695E]">Loading analytics aggregates...</p>
      ) : (
        <div className="space-y-6">
          {/* Top Revenue Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-[#E5DFD3] shadow-xs">
              <span className="text-xs text-[#73695E] font-medium block">Total Billed Revenue</span>
              <p className="text-2xl font-bold text-[#244C3A] mt-1">
                ₹{(analytics?.revenue?.total_billed || 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-[#E5DFD3] shadow-xs">
              <span className="text-xs text-[#73695E] font-medium block">Collected Revenue</span>
              <p className="text-2xl font-bold text-emerald-700 mt-1">
                ₹{(analytics?.revenue?.total_collected || 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-[#E5DFD3] shadow-xs">
              <span className="text-xs text-[#73695E] font-medium block">Pending / Uncollected</span>
              <p className="text-2xl font-bold text-rose-700 mt-1">
                ₹{(analytics?.revenue?.total_pending || 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Therapist Workload Chart */}
            <div className="bg-white p-6 rounded-3xl border border-[#E5DFD3] shadow-xs">
              <h2 className="text-base font-bold text-[#244C3A] mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                Therapist Workload Distribution
              </h2>
              <p className="text-xs text-[#73695E] mb-6">Total Panchakarma sessions managed per practitioner</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.therapists || []} layout="vertical">
                    <XAxis type="number" stroke="#73695E" fontSize={12} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" stroke="#73695E" fontSize={11} width={100} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FAF7EF',
                        borderColor: '#E5DFD3',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="sessions" name="Sessions Handled" fill="#244C3A" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Appointment Status Breakdown */}
            <div className="bg-white p-6 rounded-3xl border border-[#E5DFD3] shadow-xs">
              <h2 className="text-base font-bold text-[#244C3A] mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                Session Completion Efficiency
              </h2>
              <p className="text-xs text-[#73695E] mb-6">Breakdown of appointments by fulfillment status</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Completed', value: analytics?.appointments?.completed || 1 },
                        { name: 'Scheduled / Ongoing', value: (analytics?.appointments?.total || 2) - (analytics?.appointments?.completed || 1) },
                        { name: 'Cancelled', value: analytics?.appointments?.cancelled || 0 },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                      paddingAngle={4}
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FAF7EF',
                        borderColor: '#E5DFD3',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
