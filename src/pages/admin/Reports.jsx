import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Users, TrendingUp, CreditCard, GraduationCap, CalendarX, CheckCircle2, XCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/shared/PageHeader';
import { fetchStudents } from '@/api/students';
import { fetchTeachers } from '@/api/teachers';
import { fetchGrades } from '@/api/grades';
import { fetchPayments } from '@/api/payments';
import { fetchAbsences } from '@/api/absences';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

export default function Reports() {
    const [cycleFilter, setCycleFilter] = useState('all');
    const [trimesterFilter, setTrimesterFilter] = useState('all');

    const { data: students = [] } = useQuery({ queryKey: ['reports-students'], queryFn: fetchStudents });
    const { data: teachers = [] } = useQuery({ queryKey: ['reports-teachers'], queryFn: fetchTeachers });
    const { data: grades = [] } = useQuery({ queryKey: ['reports-grades'], queryFn: fetchGrades });
    const { data: payments = [] } = useQuery({ queryKey: ['reports-payments'], queryFn: fetchPayments });
    const { data: absences = [] } = useQuery({ queryKey: ['reports-absences'], queryFn: fetchAbsences });

    // Filtres
    const filteredStudents = cycleFilter === 'all' ? students : students.filter(s => s.cycle === cycleFilter);
    const filteredGrades = grades.filter(g => {
        const matchTrimester = trimesterFilter === 'all' || g.trimester === trimesterFilter;
        const matchCycle = cycleFilter === 'all' || students.find(s => s.id === g.student_id)?.cycle === cycleFilter;
        return matchTrimester && matchCycle;
    });

    // Stats élèves
    const byCycle = ['Maternelle', 'Primaire', 'Collège'].map((cycle) => ({
        cycle,
        count: students.filter(s => s.cycle === cycle).length,
    }));

    const byLevel = Array.from(new Set(filteredStudents.map(s => s.level).filter(Boolean)))
        .map(level => ({
            level,
            count: filteredStudents.filter(s => s.level === level).length,
        }))
        .sort((a, b) => b.count - a.count);

    // Stats paiements
    const byMonth = payments.reduce((acc, p) => {
        if (!p.payment_date || p.status !== 'Payé') return acc;
        const month = p.payment_date.slice(0, 7);
        acc[month] = (acc[month] || 0) + (p.amount || 0);
        return acc;
    }, {});

    const paymentChart = Object.entries(byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, total]) => ({ month: month.slice(5), total }));

    const paymentStatus = ['Payé', 'En attente', 'Partiel'].map((status, i) => ({
        name: status,
        value: payments.filter(p => p.status === status).length,
        color: COLORS[i],
    }));

    const totalRevenue = payments
        .filter(p => p.status === 'Payé')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

    // Stats notes
    const bySubject = Array.from(new Set(filteredGrades.map(g => g.subject).filter(Boolean)))
        .map(subject => {
            const sg = filteredGrades.filter(g => g.subject === subject);
            const avg = sg.reduce((sum, g) => sum + (g.grade || 0), 0) / sg.length;
            return { subject, moyenne: parseFloat(avg.toFixed(2)) };
        })
        .sort((a, b) => b.moyenne - a.moyenne);

    const avgGrade = filteredGrades.length
        ? (filteredGrades.reduce((sum, g) => sum + (g.grade || 0), 0) / filteredGrades.length).toFixed(2)
        : '—';

    const topStudents = Object.entries(
        filteredGrades.reduce((acc, g) => {
            if (!acc[g.student_id]) acc[g.student_id] = { name: g.student_name, total: 0, count: 0 };
            acc[g.student_id].total += g.grade || 0;
            acc[g.student_id].count += 1;
            return acc;
        }, {})
    )
        .map(([id, data]) => ({ id, name: data.name, avg: parseFloat((data.total / data.count).toFixed(2)) }))
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 5);

    const weakStudents = Object.entries(
        filteredGrades.reduce((acc, g) => {
            if (!acc[g.student_id]) acc[g.student_id] = { name: g.student_name, total: 0, count: 0 };
            acc[g.student_id].total += g.grade || 0;
            acc[g.student_id].count += 1;
            return acc;
        }, {})
    )
        .map(([id, data]) => ({ id, name: data.name, avg: parseFloat((data.total / data.count).toFixed(2)) }))
        .filter(s => s.avg < 10)
        .sort((a, b) => a.avg - b.avg)
        .slice(0, 5);

    // Stats absences
    const justifiedCount = absences.filter(a => a.justified).length;
    const unjustifiedCount = absences.filter(a => !a.justified).length;

    const absenceByMonth = absences.reduce((acc, a) => {
        if (!a.date) return acc;
        const month = a.date.slice(0, 7);
        acc[month] = (acc[month] || 0) + 1;
        return acc;
    }, {});
    const absenceChart = Object.entries(absenceByMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({ month: month.slice(5), count }));

    return (
        <div className="space-y-8">
            <PageHeader title="Rapports & Statistiques" subtitle="Vue d'ensemble de l'établissement" />

            {/* Filtres */}
            <div className="flex gap-3 flex-wrap">
                <Select value={cycleFilter} onValueChange={setCycleFilter}>
                    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les cycles</SelectItem>
                        <SelectItem value="Maternelle">Maternelle</SelectItem>
                        <SelectItem value="Primaire">Primaire</SelectItem>
                        <SelectItem value="Collège">Collège</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={trimesterFilter} onValueChange={setTrimesterFilter}>
                    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les trimestres</SelectItem>
                        <SelectItem value="Trimestre 1">Trimestre 1</SelectItem>
                        <SelectItem value="Trimestre 2">Trimestre 2</SelectItem>
                        <SelectItem value="Trimestre 3">Trimestre 3</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total élèves', value: filteredStudents.length, icon: Users, color: 'bg-blue-500' },
                    { label: 'Enseignants actifs', value: teachers.filter(t => t.status === 'Actif').length, icon: GraduationCap, color: 'bg-emerald-500' },
                    { label: 'Revenus perçus', value: `${(totalRevenue / 1000).toFixed(0)}K FCFA`, icon: CreditCard, color: 'bg-amber-500' },
                    { label: 'Moyenne générale', value: `${avgGrade}/20`, icon: TrendingUp, color: 'bg-purple-500' },
                ].map(kpi => (
                    <div key={kpi.label} className="bg-card border border-border rounded-2xl p-5">
                        <div className={`w-10 h-10 rounded-xl ${kpi.color} flex items-center justify-center mb-3`}>
                            <kpi.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
                        <div className="text-xs text-muted-foreground mt-1">{kpi.label}</div>
                    </div>
                ))}
            </div>

            {/* Charts élèves */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-2xl p-6">
                    <h3 className="font-semibold text-foreground mb-4">Élèves par cycle</h3>
                    <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                            <Pie data={byCycle} dataKey="count" nameKey="cycle" cx="50%" cy="50%" outerRadius={90}
                                label={({ cycle, count }) => `${cycle}: ${count}`}>
                                {byCycle.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6">
                    <h3 className="font-semibold text-foreground mb-4">Élèves par niveau</h3>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={byLevel} layout="vertical" margin={{ left: 28, right: 12 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis type="number" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} />
                            <YAxis dataKey="level" type="category" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} width={80} axisLine={false} />
                            <Tooltip />
                            <Bar dataKey="count" fill="hsl(var(--primary))" radius={4} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Charts notes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {bySubject.length > 0 && (
                    <div className="bg-card border border-border rounded-2xl p-6">
                        <h3 className="font-semibold text-foreground mb-4">Moyenne par matière</h3>
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={bySubject} layout="vertical" margin={{ left: 40, right: 12 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis type="number" domain={[0, 20]} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} />
                                <YAxis dataKey="subject" type="category" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} width={110} axisLine={false} />
                                <Tooltip />
                                <Bar dataKey="moyenne" fill="#8b5cf6" radius={4} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Top élèves */}
                <div className="bg-card border border-border rounded-2xl p-6">
                    <h3 className="font-semibold text-foreground mb-4">Top 5 élèves</h3>
                    {topStudents.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-10">Aucune note enregistrée</p>
                    ) : (
                        <div className="space-y-3">
                            {topStudents.map((s, i) => (
                                <div key={s.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-400' : 'bg-muted-foreground'}`}>
                                            {i + 1}
                                        </span>
                                        <span className="text-sm font-medium text-foreground">{s.name}</span>
                                    </div>
                                    <span className="text-sm font-bold text-emerald-600">{s.avg}/20</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Élèves en difficulté */}
                <div className="bg-card border border-border rounded-2xl p-6">
                    <h3 className="font-semibold text-foreground mb-1">Élèves en difficulté</h3>
                    <p className="text-xs text-muted-foreground mb-4">Moyenne générale {"<"} 10/20</p>
                    {weakStudents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-2">
                            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                            <p className="text-sm text-emerald-600 font-medium">Aucun élève en difficulté</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {weakStudents.map(s => (
                                <div key={s.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                        <span className="text-sm font-medium text-foreground">{s.name}</span>
                                    </div>
                                    <span className="text-sm font-bold text-red-600">{s.avg}/20</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Charts paiements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {paymentChart.length > 0 && (
                    <div className="bg-card border border-border rounded-2xl p-6">
                        <h3 className="font-semibold text-foreground mb-4">Revenus mensuels (FCFA)</h3>
                        <ResponsiveContainer width="100%" height={240}>
                            <LineChart data={paymentChart} margin={{ left: 0, right: 18 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} />
                                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} />
                                <Tooltip formatter={v => `${v.toLocaleString()} FCFA`} />
                                <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                <div className="bg-card border border-border rounded-2xl p-6">
                    <h3 className="font-semibold text-foreground mb-4">Statut des paiements</h3>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        {paymentStatus.map(s => (
                            <div key={s.name} className="text-center p-4 rounded-xl" style={{ backgroundColor: `${s.color}22` }}>
                                <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                                <div className="text-xs text-muted-foreground mt-1">{s.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Absences */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-2xl p-6">
                    <h3 className="font-semibold text-foreground mb-4">Absences par mois</h3>
                    {absenceChart.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-10">Aucune absence enregistrée</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={absenceChart} barSize={20}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} />
                                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} name="Absences" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className="bg-card border border-border rounded-2xl p-6">
                    <h3 className="font-semibold text-foreground mb-4">Absences justifiées vs non justifiées</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-emerald-600">{justifiedCount}</div>
                            <div className="text-xs text-muted-foreground mt-1">Justifiées</div>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-red-50 dark:bg-red-950/20">
                            <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-red-600">{unjustifiedCount}</div>
                            <div className="text-xs text-muted-foreground mt-1">Non justifiées</div>
                        </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                        <div
                            className="h-3 rounded-full bg-emerald-500 transition-all"
                            style={{ width: absences.length ? `${(justifiedCount / absences.length) * 100}%` : '0%' }}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                        {absences.length > 0 ? Math.round((justifiedCount / absences.length) * 100) : 0}% justifiées
                    </p>
                </div>
            </div>
        </div>
    );
}