import React from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import {
    Users, GraduationCap, School, TrendingUp, CalendarX, AlertTriangle,
    ArrowUpRight, BookOpen, CheckCircle2, Clock, XCircle
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from "@/lib/AuthContext";

const CYCLE_COLORS = ['#8b5cf6', '#3b82f6', '#10b981'];

const KPI = ({ title, value, sub, icon: Icon, accent, trend }) => (
    <div className="relative overflow-hidden bg-card rounded-2xl border border-border p-5 flex flex-col gap-3 hover:shadow-lg transition-all duration-200 group">
        <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent} group-hover:scale-110 transition-transform duration-200`}>
                <Icon className="w-5 h-5" />
            </div>
        </div>
        <div>
            <p className="text-3xl font-extrabold text-foreground tracking-tight">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        {trend !== undefined && (
            <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                <ArrowUpRight className="w-3 h-3" /> {trend}
            </div>
        )}
        <div className={`absolute bottom-0 left-0 right-0 h-1 ${accent} opacity-30 rounded-b-2xl`} />
    </div>
);

const CustomTooltip = ({ active, payload, label, formatter }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg text-xs">
            <p className="font-semibold text-foreground mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }}>{formatter ? formatter(p.value) : p.value}</p>
            ))}
        </div>
    );
};

const fetchStudents = async () => { const { data } = await supabase.from('students').select('*'); return data ?? []; };
const fetchTeachers = async () => { const { data } = await supabase.from('teachers').select('*'); return data ?? []; };
const fetchClasses = async () => { const { data } = await supabase.from('school_classes').select('*'); return data ?? []; };
const fetchPayments = async () => { const { data } = await supabase.from('payments').select('*'); return data ?? []; };
const fetchAbsences = async () => { const { data } = await supabase.from('absences').select('*'); return data ?? []; };

export default function Dashboard() {
    const { user, role } = useAuth();

    const { data: students = [] } = useQuery({ queryKey: ['students'], queryFn: fetchStudents });
    const { data: teachers = [] } = useQuery({ queryKey: ['teachers'], queryFn: fetchTeachers });
    const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: fetchClasses });
    const { data: payments = [] } = useQuery({ queryKey: ['payments'], queryFn: fetchPayments });
    const { data: absences = [] } = useQuery({ queryKey: ['absences'], queryFn: fetchAbsences });

    const activeStudents = students.filter(s => s.status === 'Actif');
    const activeTeachers = teachers.filter(t => t.status === 'Actif');
    const paidPayments = payments.filter(p => p.status === 'Payé');
    const totalRevenue = paidPayments.reduce((s, p) => s + (p.amount || 0), 0);
    const unjustified = absences.filter(a => !a.justified).length;

    const levelMap = {
        'Petite Section': 'PS', 'Moyenne Section': 'MS', 'Grande Section': 'GS',
        'CP': 'CP', 'CE1': 'CE1', 'CE2': 'CE2', 'CM1': 'CM1', 'CM2': 'CM2',
        '6ème': '6è', '5ème': '5è', '4ème': '4è', '3ème': '3è'
    };
    const levelChartData = Object.entries(levelMap).map(([full, short]) => ({
        name: short,
        count: activeStudents.filter(s => s.level === full).length,
    })).filter(d => d.count > 0);

    const cycleData = ['Maternelle', 'Primaire', 'Collège'].map((c, i) => ({
        name: c,
        value: activeStudents.filter(s => s.cycle === c).length,
        color: CYCLE_COLORS[i],
    })).filter(d => d.value > 0);

    const MONTH_LABELS = { '01': 'Jan', '02': 'Fév', '03': 'Mar', '04': 'Avr', '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Aoû', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Déc' };
    const revenueByMonth = paidPayments.reduce((acc, p) => {
        if (!p.payment_date) return acc;
        const key = MONTH_LABELS[p.payment_date.slice(5, 7)] || '?';
        acc[key] = (acc[key] || 0) + (p.amount || 0);
        return acc;
    }, {});
    const revenueTrend = Object.entries(revenueByMonth).map(([mois, montant]) => ({ mois, montant }));

    const absenceData = [
        { name: 'Justifiées', value: absences.filter(a => a.justified).length, color: '#10b981' },
        { name: 'Non justifiées', value: unjustified, color: '#ef4444' },
    ].filter(d => d.value > 0);

    const recentPayments = [...payments]
        .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))
        .slice(0, 6);

    const recentAbsences = [...absences]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    return (
        <div className="space-y-7 pb-8">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                        Bonjour, {user?.email?.split('@')[0]} 👋
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Vue d'ensemble de l'établissement · Année scolaire 2025-2026
                    </p>
                </div>
                <div className="hidden md:flex flex-col items-end gap-1">
                    <span className="text-sm font-medium text-foreground capitalize">
                        {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
                    </span>
                    <span className="text-xs bg-primary/10 text-primary font-semibold px-2.5 py-1 rounded-full capitalize">
                        {role ?? 'admin'}
                    </span>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPI title="Élèves inscrits" value={students.length}
                    sub={`${activeStudents.length} actifs`}
                    icon={Users} accent="bg-blue-500/10 text-blue-600" />
                <KPI title="Enseignants actifs" value={activeTeachers.length}
                    sub={`${teachers.length} au total`}
                    icon={GraduationCap} accent="bg-emerald-500/10 text-emerald-600" />
                <KPI title="Classes" value={classes.length}
                    sub="cette année scolaire"
                    icon={School} accent="bg-violet-500/10 text-violet-600" />
                <KPI title="Revenus encaissés"
                    value={totalRevenue >= 1000 ? `${(totalRevenue / 1000).toFixed(0)}k FCFA` : `${totalRevenue} FCFA`}
                    sub={`${paidPayments.length} paiements`}
                    icon={TrendingUp} accent="bg-amber-500/10 text-amber-600" />
            </div>

            {/* Charts row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Bar — effectifs */}
                <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="font-bold text-foreground">Effectifs par niveau</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">{activeStudents.length} élèves actifs répartis</p>
                        </div>
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="h-52">
                        {levelChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={levelChartData} barSize={18}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={24} />
                                    <Tooltip content={<CustomTooltip formatter={v => `${v} élève${v > 1 ? 's' : ''}`} />} />
                                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="Élèves" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                <BookOpen className="w-10 h-10 opacity-20" />
                                <p className="text-sm">Aucun élève enregistré</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pie — cycles */}
                <div className="bg-card rounded-2xl border border-border p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="font-bold text-foreground">Par cycle</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Répartition des élèves</p>
                        </div>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                        {cycleData.length > 0 ? (
                            <div className="w-full">
                                <div className="h-36">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={cycleData} cx="50%" cy="50%" innerRadius={38} outerRadius={60}
                                                dataKey="value" paddingAngle={4} strokeWidth={0}>
                                                {cycleData.map((d, i) => <Cell key={i} fill={d.color} />)}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip formatter={v => `${v} élève${v > 1 ? 's' : ''}`} />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-2 mt-4">
                                    {cycleData.map(d => (
                                        <div key={d.name} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                                                <span className="text-muted-foreground">{d.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-foreground">{d.value}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    ({activeStudents.length ? Math.round(d.value / activeStudents.length * 100) : 0}%)
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                <Users className="w-10 h-10 opacity-20" />
                                <p className="text-sm">Aucune donnée</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Charts row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Area — revenus */}
                <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="font-bold text-foreground">Revenus mensuels</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Total encaissé : {totalRevenue.toLocaleString()} FCFA</p>
                        </div>
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                    </div>
                    {revenueTrend.length > 0 ? (
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueTrend}>
                                    <defs>
                                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                    <XAxis dataKey="mois" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false}
                                        tickFormatter={v => `${(v / 1000).toFixed(0)}k`} width={32} />
                                    <Tooltip content={<CustomTooltip formatter={v => `${v.toLocaleString()} FCFA`} />} />
                                    <Area type="monotone" dataKey="montant" stroke="#10b981" strokeWidth={2.5}
                                        fill="url(#revGrad)" dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                                        activeDot={{ r: 6, fill: '#10b981' }} name="Revenus" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-48 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                            <TrendingUp className="w-10 h-10 opacity-20" />
                            <p className="text-sm">Aucun paiement enregistré</p>
                        </div>
                    )}
                </div>

                {/* Absences donut */}
                <div className="bg-card rounded-2xl border border-border p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="font-bold text-foreground">Absences</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">{absences.length} au total</p>
                        </div>
                        <CalendarX className="w-4 h-4 text-muted-foreground" />
                    </div>
                    {absenceData.length > 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-4">
                            <div className="h-32 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={absenceData} cx="50%" cy="50%" innerRadius={36} outerRadius={56}
                                            dataKey="value" paddingAngle={4} strokeWidth={0}>
                                            {absenceData.map((d, i) => <Cell key={i} fill={d.color} />)}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="w-full space-y-2">
                                {absenceData.map(d => (
                                    <div key={d.name} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                                            <span className="text-muted-foreground">{d.name}</span>
                                        </div>
                                        <span className="font-bold text-foreground">{d.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center gap-2">
                            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                            <p className="text-sm font-medium text-emerald-600">Aucune absence</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Recent payments */}
                <div className="bg-card rounded-2xl border border-border p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="font-bold text-foreground">Derniers paiements</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">{payments.length} paiements enregistrés</p>
                        </div>
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    </div>
                    {recentPayments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                            <TrendingUp className="w-10 h-10 opacity-20" />
                            <p className="text-sm">Aucun paiement enregistré</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {recentPayments.map(p => (
                                <div key={p.id} className="flex items-center justify-between py-2.5 px-2 rounded-xl hover:bg-muted/40 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${p.status === 'Payé' ? 'bg-emerald-100' : p.status === 'Partiel' ? 'bg-blue-100' : 'bg-amber-100'}`}>
                                            {p.status === 'Payé'
                                                ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                : p.status === 'Partiel'
                                                    ? <Clock className="w-4 h-4 text-blue-600" />
                                                    : <AlertTriangle className="w-4 h-4 text-amber-600" />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-foreground truncate">{p.student_name}</p>
                                            <p className="text-xs text-muted-foreground">{p.type}</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-3">
                                        <p className="text-sm font-bold text-foreground">{(p.amount || 0).toLocaleString()} FCFA</p>
                                        <span className={`text-xs font-medium ${p.status === 'Payé' ? 'text-emerald-700' : p.status === 'Partiel' ? 'text-blue-700' : 'text-amber-700'}`}>
                                            {p.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent absences */}
                <div className="bg-card rounded-2xl border border-border p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="font-bold text-foreground">Absences récentes</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">{unjustified} non justifiée{unjustified > 1 ? 's' : ''}</p>
                        </div>
                        <CalendarX className="w-4 h-4 text-muted-foreground" />
                    </div>
                    {recentAbsences.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2">
                            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                            <p className="text-sm font-medium text-muted-foreground">Aucune absence récente</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {recentAbsences.map(a => (
                                <div key={a.id} className="flex items-center justify-between py-2.5 px-2 rounded-xl hover:bg-muted/40 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${a.justified ? 'bg-emerald-100' : 'bg-red-100'}`}>
                                            {a.justified
                                                ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                : <XCircle className="w-4 h-4 text-red-600" />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-foreground truncate">{a.student_name}</p>
                                            <p className="text-xs text-muted-foreground">{a.session} · {a.reason || 'Aucun motif'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-3">
                                        <p className="text-xs text-muted-foreground">
                                            {a.date ? format(new Date(a.date), 'dd MMM', { locale: fr }) : '—'}
                                        </p>
                                        <span className={`text-xs font-medium ${a.justified ? 'text-emerald-700' : 'text-red-600'}`}>
                                            {a.justified ? 'Justifiée' : 'Non justifiée'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}