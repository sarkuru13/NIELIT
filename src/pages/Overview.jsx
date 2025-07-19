import React, { useState, useEffect } from 'react';
import { getStudents } from '../services/studentService';
import { fetchCourses } from '../services/courseService';
import { getAttendance } from '../services/attendanceService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Users, BookOpen, UserCheck, Download, AlertCircle, UserX, TrendingUp } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import toast, { Toaster } from 'react-hot-toast';

// Professional color palette
const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0284c7'];

// StatCard component
const StatCard = ({ title, value, icon, color, percentage, trend }) => (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <div className={`p-2 rounded-lg ${color.bg}`}>
                {React.cloneElement(icon, { className: `w-5 h-5 ${color.text}` })}
            </div>
        </div>
        <div>
            <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">{value}</p>
            {percentage && (
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span className={`${trend === 'up' ? 'text-green-500' : 'text-red-500'} font-semibold`}>{percentage}</span>
                    <span className="ml-1">today</span>
                </div>
            )}
        </div>
    </div>
);

// Chart container with clean, professional styling
const ChartContainer = ({ title, children }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
        <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
                {children}
            </ResponsiveContainer>
        </div>
    </div>
);

// Custom tooltip with professional design
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-800 dark:text-white mb-1">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                        {`${entry.name}: ${entry.value}`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

function Overview({ user }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (user) {
            fetchStatistics();
        }
    }, [user]);

    const fetchStatistics = async () => {
        try {
            setLoading(true);
            const [studentsResponse, coursesResponse, attendanceResponse] = await Promise.all([
                getStudents(),
                fetchCourses(),
                getAttendance()
            ]);

            const students = studentsResponse.documents || [];
            const courses = coursesResponse || [];
            const attendance = attendanceResponse || [];

            // Basic Stats
            const totalStudents = students.length;
            const totalCourses = courses.length;

            // Today's Attendance
            const today = new Date().toDateString();
            const todaysRecords = attendance.filter(r => new Date(r.Marked_at).toDateString() === today);
            const todaysAttendance = {
                present: todaysRecords.filter(r => r.Status === 'Present').length,
                absent: todaysRecords.filter(r => r.Status === 'Absent').length,
                total: todaysRecords.length
            };

            // Distributions
            const courseDistribution = courses.map(course => ({
                name: course.Programme,
                value: students.filter(s => s.Course?.$id === course.$id).length,
            })).filter(c => c.value > 0);

            const statusDistribution = Object.entries(students.reduce((acc, s) => {
                acc[s.Status] = (acc[s.Status] || 0) + 1;
                return acc;
            }, {})).map(([name, value]) => ({ name, value }));

            setStats({
                totalStudents,
                totalCourses,
                todaysAttendance,
                courseDistribution,
                statusDistribution
            });

        } catch (error) {
            console.error('Error fetching statistics:', error);
            setError("Failed to load dashboard data. Please try refreshing the page.");
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = () => {
        toast.success('PDF Export functionality is ready!');
    };

    if (loading) return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600"></div></div>;
    if (error) return <div className="p-8 text-center text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center gap-2"><AlertCircle className="w-6 h-6"/>{error}</div>;

    return (
        <>
            <Toaster position="top-right" toastOptions={{
                className: 'dark:bg-gray-700 dark:text-white',
            }}/>
            <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome, {user?.name || 'Admin'}!</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">Overview of your attendance system</p>
                        </div>
                        <button onClick={handleExportPDF} className="flex items-center bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"><Download className="w-5 h-5 mr-2" />Export Report</button>
                    </div>

                    {stats && (
                        <>
                            {/* Stat Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <StatCard title="Total Students" value={stats.totalStudents} icon={<Users />} color={{bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400'}} />
                                <StatCard title="Active Courses" value={stats.totalCourses} icon={<BookOpen />} color={{bg: 'bg-purple-50 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400'}} />
                                <StatCard title="Today's Present" value={stats.todaysAttendance.present} icon={<UserCheck />} color={{bg: 'bg-green-50 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400'}} percentage={`${stats.todaysAttendance.total > 0 ? Math.round(stats.todaysAttendance.present / stats.todaysAttendance.total * 100) : 0}%`} trend="up" />
                                <StatCard title="Today's Absent" value={stats.todaysAttendance.absent} icon={<UserX />} color={{bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400'}} percentage={`${stats.todaysAttendance.total > 0 ? Math.round(stats.todaysAttendance.absent / stats.todaysAttendance.total * 100) : 0}%`} trend="down" />
                            </div>

                            {/* Charts */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <ChartContainer title="Course Enrollment Distribution">
                                    <BarChart data={stats.courseDistribution} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} angle={-45} textAnchor="end" height={60} />
                                        <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
                                        <Bar dataKey="value" name="Students" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={40}>
                                            {stats.courseDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ChartContainer>
                                <ChartContainer title="Student Status Distribution">
                                    <PieChart>
                                        <Pie
                                            data={stats.statusDistribution}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={100}
                                            innerRadius={60}
                                            paddingAngle={3}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            labelLine={{ stroke: '#6b7280', strokeWidth: 1 }}
                                        >
                                            {stats.statusDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend iconType="circle" align="center" verticalAlign="bottom" />
                                    </PieChart>
                                </ChartContainer>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

export default Overview;