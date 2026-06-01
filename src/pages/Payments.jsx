import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPayments, createPayment, updatePayment, deletePayment } from '@/api/payments';
import { fetchStudents } from '@/api/students';
import { fetchClasses } from '@/api/classes';
import { fetchFeeConfigs, createFeeConfig, updateFeeConfig, deleteFeeConfig } from '@/api/feeConfigs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, CreditCard, Trash2, Pencil, AlertTriangle, CheckCircle, BarChart2, Settings, Users } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
    'Payé': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
    'Partiel': 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
    'En attente': 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
};

const PAYMENT_TYPES = ['Scolarité', 'Inscription', 'Cantine', 'Transport', 'Fournitures', 'Autre'];
const PAYMENT_METHODS = ['Espèces', 'Chèque', 'Virement', 'Mobile Money'];
const TRIMESTERS = ['Trimestre 1', 'Trimestre 2', 'Trimestre 3', 'Annuel'];
const CYCLES = ['Maternelle', 'Primaire', 'Collège'];
const LEVELS_BY_CYCLE = {
    Maternelle: ['Petite Section', 'Moyenne Section', 'Grande Section'],
    Primaire: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
    Collège: ['6ème', '5ème', '4ème', '3ème'],
};

const defaultPaymentForm = () => ({
    student_id: '', student_name: '', amount: '', type: 'Scolarité',
    method: 'Espèces', status: 'Payé', trimester: 'Annuel',
    school_year: '2025-2026',
    payment_date: new Date().toISOString().split('T')[0],
    notes: '',
});

const defaultFeeForm = () => ({
    school_year: '2025-2026',
    cycle: '', level: '',
    type: 'Scolarité', amount: '',
    trimester_1: '', trimester_2: '', trimester_3: '',
    description: '',
});

export default function Payments() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [unpaidSearch, setUnpaidSearch] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');
    const [form, setForm] = useState(defaultPaymentForm());

    // Fee config state
    const [feeDialogOpen, setFeeDialogOpen] = useState(false);
    const [editingFeeId, setEditingFeeId] = useState(null);
    const [deleteFeeId, setDeleteFeeId] = useState(null);
    const [feeForm, setFeeForm] = useState(defaultFeeForm());

    const queryClient = useQueryClient();

    const { data: payments = [] } = useQuery({ queryKey: ['payments'], queryFn: fetchPayments });
    const { data: students = [] } = useQuery({ queryKey: ['students'], queryFn: fetchStudents });
    const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: fetchClasses });
    const { data: feeConfigs = [] } = useQuery({ queryKey: ['fee_configs'], queryFn: fetchFeeConfigs });

    // Payment mutations
    const createMut = useMutation({
        mutationFn: createPayment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            closeDialog();
            toast.success('Paiement enregistré');
        },
        onError: () => toast.error("Erreur lors de l'enregistrement"),
    });

    const updateMut = useMutation({
        mutationFn: ({ id, data }) => updatePayment(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            closeDialog();
            toast.success('Paiement mis à jour');
        },
        onError: () => toast.error('Erreur lors de la mise à jour'),
    });

    const deleteMut = useMutation({
        mutationFn: deletePayment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            setDeleteId(null);
            toast.success('Paiement supprimé');
        },
        onError: () => toast.error('Erreur lors de la suppression'),
    });

    // Fee config mutations
    const createFeeMut = useMutation({
        mutationFn: createFeeConfig,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fee_configs'] });
            closeFeeDialog();
            toast.success('Configuration enregistrée');
        },
        onError: () => toast.error("Erreur lors de l'enregistrement"),
    });

    const updateFeeMut = useMutation({
        mutationFn: ({ id, data }) => updateFeeConfig(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fee_configs'] });
            closeFeeDialog();
            toast.success('Configuration mise à jour');
        },
        onError: () => toast.error('Erreur lors de la mise à jour'),
    });

    const deleteFeeMut = useMutation({
        mutationFn: deleteFeeConfig,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fee_configs'] });
            setDeleteFeeId(null);
            toast.success('Configuration supprimée');
        },
        onError: () => toast.error('Erreur lors de la suppression'),
    });

    const closeDialog = () => {
        setDialogOpen(false);
        setEditingId(null);
        setForm(defaultPaymentForm());
    };

    const closeFeeDialog = () => {
        setFeeDialogOpen(false);
        setEditingFeeId(null);
        setFeeForm(defaultFeeForm());
    };

    const openCreate = () => {
        setEditingId(null);
        setForm(defaultPaymentForm());
        setDialogOpen(true);
    };

    const openEdit = (p) => {
        setEditingId(p.id);
        setForm({
            student_id: p.student_id || '',
            student_name: p.student_name || '',
            amount: p.amount || '',
            type: p.type || 'Scolarité',
            method: p.method || 'Espèces',
            status: p.status || 'Payé',
            trimester: p.trimester || 'Annuel',
            school_year: p.school_year || '2025-2026',
            payment_date: p.payment_date || new Date().toISOString().split('T')[0],
            notes: p.notes || '',
        });
        setDialogOpen(true);
    };

    const openFeeCreate = () => {
        setEditingFeeId(null);
        setFeeForm(defaultFeeForm());
        setFeeDialogOpen(true);
    };

    const openFeeEdit = (f) => {
        setEditingFeeId(f.id);
        setFeeForm({
            school_year: f.school_year || '2025-2026',
            cycle: f.cycle || '',
            level: f.level || '',
            class_id: f.class_id || '',
            type: f.type || 'Scolarité',
            amount: f.amount || '',
            trimester_1: f.trimester_1 || '',
            trimester_2: f.trimester_2 || '',
            trimester_3: f.trimester_3 || '',
            description: f.description || '',
        });
        setFeeDialogOpen(true);
    };

    const handleStudentChange = (studentId) => {
        const s = students.find(st => st.id === studentId);
        setForm(f => ({
            ...f,
            student_id: studentId,
            student_name: s ? `${s.first_name} ${s.last_name}` : '',
        }));
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (!form.student_id) { toast.error('Sélectionnez un élève'); return; }
        if (!form.amount) { toast.error('Entrez un montant'); return; }
        const payload = { ...form, amount: parseFloat(form.amount) };
        if (editingId) {
            updateMut.mutate({ id: editingId, data: payload });
        } else {
            createMut.mutate(payload);
        }
    };

    const handleFeeSave = (e) => {
        e.preventDefault();
        if (!feeForm.amount) { toast.error('Entrez un montant'); return; }
        if (!feeForm.cycle) { toast.error('Sélectionnez un cycle'); return; }

        const { class_id, ...feeWithoutClassId } = feeForm;

        const payload = {
            ...feeWithoutClassId,
            amount: parseFloat(feeForm.amount),
            trimester_1: feeForm.trimester_1 ? parseFloat(feeForm.trimester_1) : null,
            trimester_2: feeForm.trimester_2 ? parseFloat(feeForm.trimester_2) : null,
            trimester_3: feeForm.trimester_3 ? parseFloat(feeForm.trimester_3) : null,
            cycle: feeForm.cycle || null,
            level: feeForm.level || null,
        };

        if (editingFeeId) {
            updateFeeMut.mutate({ id: editingFeeId, data: payload });
        } else {
            createFeeMut.mutate(payload);
        }
    };

    // Fonction pour trouver les frais applicables à un élève
    const getApplicableFee = (student) => {
        // Priorité : niveau > cycle
        let fee = feeConfigs.find(f =>
            f.level === student.level &&
            f.type === 'Scolarité' &&
            f.school_year === '2025-2026'
        );
        if (!fee) {
            fee = feeConfigs.find(f =>
                !f.level && f.cycle === student.cycle &&
                f.type === 'Scolarité' &&
                f.school_year === '2025-2026'
            );
        }
        return fee;
    };

    // Stats
    const totalPaid = payments.filter(p => p.status === 'Payé').reduce((s, p) => s + (p.amount || 0), 0);
    const totalPending = payments.filter(p => p.status !== 'Payé').reduce((s, p) => s + (p.amount || 0), 0);
    const studentsWithUnpaid = students.filter(s =>
        s.status === 'Actif' && payments.some(p => p.student_id === s.id && p.status !== 'Payé')
    ).length;

    // Filtered payments
    const filtered = payments.filter(p => {
        const matchSearch = p.student_name?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || p.status === statusFilter;
        const matchType = typeFilter === 'all' || p.type === typeFilter;
        return matchSearch && matchStatus && matchType;
    });

    const [unpaidPage, setUnpaidPage] = useState(1);
    const [unpaidSort, setUnpaidSort] = useState('remaining_desc');
    const [unpaidCycleFilter, setUnpaidCycleFilter] = useState('all');
    const ITEMS_PER_PAGE = 10;

    // Impayés
    const allUnpaidStudents = students
        .filter(s => s.status === 'Actif')
        .map(s => {
            const fee = getApplicableFee(s);
            const totalDue = fee?.amount || 0;
            const totalPaidByStudent = payments
                .filter(p => p.student_id === s.id && p.status === 'Payé' && p.type === 'Scolarité')
                .reduce((acc, p) => acc + (p.amount || 0), 0);
            const remaining = Math.max(0, totalDue - totalPaidByStudent);
            const unpaidPayments = payments.filter(p => p.student_id === s.id && p.status !== 'Payé');
            return { ...s, totalDue, totalPaidByStudent, remaining, unpaidPayments };
        })
        .filter(s => s.remaining > 0)
        .filter(s => `${s.first_name} ${s.last_name}`.toLowerCase().includes(unpaidSearch.toLowerCase()))
        .filter(s => unpaidCycleFilter === 'all' || s.cycle === unpaidCycleFilter)
        .sort((a, b) => {
            if (unpaidSort === 'remaining_desc') return b.remaining - a.remaining;
            if (unpaidSort === 'remaining_asc') return a.remaining - b.remaining;
            if (unpaidSort === 'name_asc') return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
            return 0;
        });

    const grandTotal = allUnpaidStudents.reduce((acc, s) => acc + s.remaining, 0);
    const totalPages = Math.ceil(allUnpaidStudents.length / ITEMS_PER_PAGE);
    const unpaidStudents = allUnpaidStudents.slice((unpaidPage - 1) * ITEMS_PER_PAGE, unpaidPage * ITEMS_PER_PAGE);

    // Évolution par classe
    const classStudents = selectedClassId ? students.filter(s => s.class_id === selectedClassId) : [];
    const classPayments = selectedClassId
        ? payments.filter(p => classStudents.some(s => s.id === p.student_id))
        : [];

    const MONTH_LABELS = {
        '01': 'Jan', '02': 'Fév', '03': 'Mar', '04': 'Avr', '05': 'Mai', '06': 'Jun',
        '07': 'Jul', '08': 'Aoû', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Déc'
    };
    const monthlyData = classPayments
        .filter(p => p.status === 'Payé' && p.payment_date)
        .reduce((acc, p) => {
            const key = MONTH_LABELS[p.payment_date.slice(5, 7)] || '?';
            acc[key] = (acc[key] || 0) + (p.amount || 0);
            return acc;
        }, {});
    const chartData = Object.entries(monthlyData).map(([mois, montant]) => ({ mois, montant }));

    const classStatusData = [
        { name: 'Payé', value: classPayments.filter(p => p.status === 'Payé').length, color: '#10b981' },
        { name: 'En attente', value: classPayments.filter(p => p.status === 'En attente').length, color: '#ef4444' },
        { name: 'Partiel', value: classPayments.filter(p => p.status === 'Partiel').length, color: '#f59e0b' },
    ];

    // Suivi scolarité
    const schoolFeeTracking = students
        .filter(s => s.status === 'Actif')
        .map(s => {
            const fee = getApplicableFee(s);
            const totalDue = fee?.amount || 0;
            const totalPaidByStudent = payments
                .filter(p => p.student_id === s.id && p.status === 'Payé' && p.type === 'Scolarité')
                .reduce((acc, p) => acc + (p.amount || 0), 0);
            const remaining = Math.max(0, totalDue - totalPaidByStudent);
            const percent = totalDue > 0 ? Math.min(100, (totalPaidByStudent / totalDue) * 100) : 0;
            return { ...s, totalDue, totalPaidByStudent, remaining, percent, fee };
        });

    const isPending = createMut.isPending || updateMut.isPending;
    const isFeePending = createFeeMut.isPending || updateFeeMut.isPending;

    return (
        <div className="space-y-6">
            <PageHeader title="Paiements" subtitle="Suivi des frais de scolarité">
                <Button onClick={openCreate}>
                    <Plus className="w-4 h-4 mr-2" /> Nouveau paiement
                </Button>
            </PageHeader>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card rounded-2xl border border-border p-4">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total encaissé</p>
                    <p className="text-2xl font-extrabold text-emerald-600 mt-1">{totalPaid.toLocaleString()} FCFA</p>
                    <p className="text-xs text-muted-foreground mt-1">{payments.filter(p => p.status === 'Payé').length} paiements</p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-4">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Restant dû</p>
                    <p className="text-2xl font-extrabold text-red-500 mt-1">{totalPending.toLocaleString()} FCFA</p>
                    <p className="text-xs text-muted-foreground mt-1">{payments.filter(p => p.status !== 'Payé').length} paiements</p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-4">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total paiements</p>
                    <p className="text-2xl font-extrabold text-foreground mt-1">{payments.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">toutes catégories</p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-4">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Élèves avec impayés</p>
                    <p className="text-2xl font-extrabold text-amber-600 mt-1">{studentsWithUnpaid}</p>
                    <p className="text-xs text-muted-foreground mt-1">élèves concernés</p>
                </div>
            </div>

            <Tabs defaultValue="all">
                <TabsList className="mb-4 flex-wrap">
                    <TabsTrigger value="all">
                        <CreditCard className="w-4 h-4 mr-1.5" /> Paiements
                    </TabsTrigger>
                    <TabsTrigger value="tracking">
                        <Users className="w-4 h-4 mr-1.5" /> Suivi scolarité
                    </TabsTrigger>
                    <TabsTrigger value="unpaid">
                        <AlertTriangle className="w-4 h-4 mr-1.5" /> Impayés
                    </TabsTrigger>
                    <TabsTrigger value="evolution">
                        <BarChart2 className="w-4 h-4 mr-1.5" /> Évolution
                    </TabsTrigger>
                    <TabsTrigger value="fees">
                        <Settings className="w-4 h-4 mr-1.5" /> Config frais
                    </TabsTrigger>
                </TabsList>

                {/* Tab 1: Tous les paiements */}
                <TabsContent value="all" className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="Rechercher par élève..." value={search}
                                onChange={e => setSearch(e.target.value)} className="pl-9" />
                        </div>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les types</SelectItem>
                                {PAYMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les statuts</SelectItem>
                                <SelectItem value="Payé">Payé</SelectItem>
                                <SelectItem value="En attente">En attente</SelectItem>
                                <SelectItem value="Partiel">Partiel</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {filtered.length === 0 ? (
                        <EmptyState icon={CreditCard} title="Aucun paiement" description="Enregistrez le premier paiement." />
                    ) : (
                        <div className="bg-card rounded-xl border border-border overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-muted/50 border-b border-border">
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Élève</th>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Montant</th>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">Mode</th>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">Trimestre</th>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">Date</th>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Statut</th>
                                            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map(p => (
                                            <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                                <td className="py-3 px-4 font-medium text-foreground">{p.student_name}</td>
                                                <td className="py-3 px-4 text-muted-foreground">{p.type}</td>
                                                <td className="py-3 px-4 font-semibold text-foreground">{p.amount?.toLocaleString()} FCFA</td>
                                                <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{p.method}</td>
                                                <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{p.trimester}</td>
                                                <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                                                    {p.payment_date ? format(new Date(p.payment_date), 'dd MMM yyyy', { locale: fr }) : '—'}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[p.status] || ''}`}>
                                                        {p.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button size="icon" variant="ghost" onClick={() => openEdit(p)}>
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" onClick={() => setDeleteId(p.id)}>
                                                            <Trash2 className="w-4 h-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="px-4 py-3 border-t border-border bg-muted/30">
                                <p className="text-xs text-muted-foreground">
                                    {filtered.length} paiement{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
                                    {filtered.length !== payments.length && ` sur ${payments.length}`}
                                </p>
                            </div>
                        </div>
                    )}
                </TabsContent>

                {/* Tab 2: Suivi scolarité */}
                <TabsContent value="tracking" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Suivi des frais de scolarité par élève · Année 2025-2026
                        </p>
                        {feeConfigs.length === 0 && (
                            <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-3 py-1.5 rounded-lg">
                                ⚠️ Configurez d'abord les frais dans l'onglet "Config frais"
                            </p>
                        )}
                    </div>

                    {schoolFeeTracking.length === 0 ? (
                        <EmptyState icon={Users} title="Aucun élève actif" description="Ajoutez des élèves pour suivre les paiements." />
                    ) : (
                        <div className="bg-card rounded-xl border border-border overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-muted/50 border-b border-border">
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Élève</th>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">Niveau</th>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Frais total</th>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Payé</th>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Restant</th>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Progression</th>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {schoolFeeTracking.map(s => (
                                            <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                                                            {s.photo_url
                                                                ? <img src={s.photo_url} alt="" className="w-full h-full object-cover" />
                                                                : <span className="text-xs font-bold text-muted-foreground">{s.first_name?.[0]}{s.last_name?.[0]}</span>
                                                            }
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-foreground">{s.first_name} {s.last_name}</p>
                                                            {s.parent_phone && <p className="text-xs text-muted-foreground">{s.parent_phone}</p>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{s.level}</td>
                                                <td className="py-3 px-4 font-medium text-foreground">
                                                    {s.totalDue > 0 ? `${s.totalDue.toLocaleString()} FCFA` : <span className="text-muted-foreground/50">Non configuré</span>}
                                                </td>
                                                <td className="py-3 px-4 font-semibold text-emerald-600">{s.totalPaidByStudent.toLocaleString()} FCFA</td>
                                                <td className="py-3 px-4 font-semibold text-red-500">
                                                    {s.remaining > 0 ? `${s.remaining.toLocaleString()} FCFA` : '—'}
                                                </td>
                                                <td className="py-3 px-4 w-32">
                                                    {s.totalDue > 0 ? (
                                                        <div className="space-y-1">
                                                            <div className="w-full bg-muted rounded-full h-2">
                                                                <div
                                                                    className={`h-2 rounded-full transition-all ${s.percent === 100 ? 'bg-emerald-500' : s.percent >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                                    style={{ width: `${s.percent}%` }}
                                                                />
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">{Math.round(s.percent)}%</p>
                                                        </div>
                                                    ) : '—'}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.percent === 100
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                                        : s.percent > 0
                                                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                                                            : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                                                        }`}>
                                                        {s.percent === 100 ? 'Soldé' : s.percent > 0 ? 'Partiel' : 'Non payé'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </TabsContent>
                {/* Tab 3: Impayés */}
                {/* Tab 3: Impayés */}
                <TabsContent value="unpaid" className="space-y-4">

                    {/* Stats rapides */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-card rounded-xl border border-border p-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Élèves concernés</p>
                            <p className="text-2xl font-extrabold text-red-600 mt-1">{allUnpaidStudents.length}</p>
                        </div>
                        <div className="bg-card rounded-xl border border-border p-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Total restant dû</p>
                            <p className="text-2xl font-extrabold text-red-600 mt-1">{grandTotal.toLocaleString()} FCFA</p>
                        </div>
                        <div className="bg-card rounded-xl border border-border p-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Moyenne par élève</p>
                            <p className="text-2xl font-extrabold text-amber-600 mt-1">
                                {allUnpaidStudents.length > 0
                                    ? Math.round(grandTotal / allUnpaidStudents.length).toLocaleString()
                                    : 0} FCFA
                            </p>
                        </div>
                    </div>

                    {/* Filtres */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex gap-3 flex-wrap">
                            <div className="relative w-56">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input placeholder="Rechercher..." value={unpaidSearch}
                                    onChange={e => { setUnpaidSearch(e.target.value); setUnpaidPage(1); }} className="pl-9" />
                            </div>
                            <Select value={unpaidCycleFilter} onValueChange={v => { setUnpaidCycleFilter(v); setUnpaidPage(1); }}>
                                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les cycles</SelectItem>
                                    {CYCLES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={unpaidSort} onValueChange={setUnpaidSort}>
                                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="remaining_desc">Reste ↓ (plus élevé)</SelectItem>
                                    <SelectItem value="remaining_asc">Reste ↑ (plus faible)</SelectItem>
                                    <SelectItem value="name_asc">Nom A → Z</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {allUnpaidStudents.length} élève{allUnpaidStudents.length > 1 ? 's' : ''} · Page {unpaidPage}/{totalPages || 1}
                        </p>
                    </div>

                    {allUnpaidStudents.length === 0 ? (
                        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-2xl p-12 text-center">
                            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                            <p className="text-emerald-700 dark:text-emerald-400 font-semibold text-lg">Aucun impayé !</p>
                            <p className="text-emerald-600 dark:text-emerald-500 text-sm mt-1">Tous les élèves sont à jour.</p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3">
                                {unpaidStudents.map(s => (
                                    <div key={s.id} className="bg-card border border-border rounded-2xl p-5">
                                        <div className="flex items-start justify-between gap-4 flex-wrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center shrink-0">
                                                    {s.photo_url
                                                        ? <img src={s.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                                                        : <AlertTriangle className="w-5 h-5 text-red-500" />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-foreground">{s.first_name} {s.last_name}</p>
                                                    <p className="text-xs text-muted-foreground">{s.level} · {s.cycle}</p>
                                                    {s.parent_name && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Parent : {s.parent_name} {s.parent_phone && `· ${s.parent_phone}`}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-extrabold text-red-600">{s.remaining.toLocaleString()} FCFA</p>
                                                <p className="text-xs text-muted-foreground">reste à payer</p>
                                            </div>
                                        </div>

                                        {/* Barre de progression */}
                                        {s.totalDue > 0 && (
                                            <div className="mt-3">
                                                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                                    <span>Payé : {s.totalPaidByStudent.toLocaleString()} FCFA</span>
                                                    <span>Total : {s.totalDue.toLocaleString()} FCFA</span>
                                                </div>
                                                <div className="w-full bg-muted rounded-full h-2">
                                                    <div
                                                        className="h-2 rounded-full bg-emerald-500 transition-all"
                                                        style={{ width: `${Math.min(100, (s.totalPaidByStudent / s.totalDue) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Badges paiements en attente */}
                                        {s.unpaidPayments.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <span className="text-xs text-muted-foreground font-medium">Paiements en attente :</span>
                                                {s.unpaidPayments.map(p => (
                                                    <span key={p.id} className={`text-xs px-2.5 py-1 rounded-full ${STATUS_COLORS[p.status] || ''}`}>
                                                        {p.type} · {p.trimester} · {p.amount?.toLocaleString()} FCFA
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 pt-2">
                                    <Button
                                        variant="outline" size="sm"
                                        onClick={() => setUnpaidPage(p => Math.max(1, p - 1))}
                                        disabled={unpaidPage === 1}>
                                        ← Précédent
                                    </Button>
                                    <div className="flex gap-1">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                                            .filter(p => p === 1 || p === totalPages || Math.abs(p - unpaidPage) <= 1)
                                            .map((p, idx, arr) => (
                                                <React.Fragment key={p}>
                                                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                                                        <span className="px-2 py-1 text-muted-foreground">...</span>
                                                    )}
                                                    <Button
                                                        variant={unpaidPage === p ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => setUnpaidPage(p)}
                                                        className="w-8 h-8 p-0">
                                                        {p}
                                                    </Button>
                                                </React.Fragment>
                                            ))
                                        }
                                    </div>
                                    <Button
                                        variant="outline" size="sm"
                                        onClick={() => setUnpaidPage(p => Math.min(totalPages, p + 1))}
                                        disabled={unpaidPage === totalPages}>
                                        Suivant →
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </TabsContent>

                {/* Tab 4: Évolution par classe */}
                <TabsContent value="evolution" className="space-y-5">
                    <div className="flex items-center gap-3">
                        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                            <SelectTrigger className="w-56">
                                <SelectValue placeholder="Sélectionner une classe" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {selectedClassId && (
                            <span className="text-sm text-muted-foreground">
                                {classStudents.length} élève(s) · {classPayments.length} paiement(s)
                            </span>
                        )}
                    </div>

                    {!selectedClassId ? (
                        <EmptyState icon={BarChart2} title="Sélectionnez une classe"
                            description="Choisissez une classe pour voir l'évolution des paiements." />
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                            <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
                                <h3 className="font-bold text-foreground mb-4">Revenus encaissés par mois</h3>
                                {chartData.length > 0 ? (
                                    <div className="h-56">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData} barSize={20}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                                <XAxis dataKey="mois" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false}
                                                    tickFormatter={v => `${(v / 1000).toFixed(0)}k`} width={32} />
                                                <Tooltip formatter={v => [`${v.toLocaleString()} FCFA`, 'Revenus']} />
                                                <Bar dataKey="montant" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-16">Aucun paiement encaissé</p>
                                )}
                            </div>

                            <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                                <h3 className="font-bold text-foreground">Statut des paiements</h3>
                                {classStatusData.map(d => (
                                    <div key={d.name} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">{d.name}</span>
                                            <span className="font-bold text-foreground">{d.value}</span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2">
                                            <div className="h-2 rounded-full transition-all"
                                                style={{
                                                    width: classPayments.length ? `${(d.value / classPayments.length) * 100}%` : '0%',
                                                    backgroundColor: d.color,
                                                }} />
                                        </div>
                                    </div>
                                ))}
                                <div className="pt-2 border-t border-border">
                                    <p className="text-xs text-muted-foreground">Total encaissé</p>
                                    <p className="text-xl font-extrabold text-emerald-600">
                                        {classPayments.filter(p => p.status === 'Payé').reduce((s, p) => s + (p.amount || 0), 0).toLocaleString()} FCFA
                                    </p>
                                </div>
                            </div>

                            <div className="lg:col-span-3 bg-card rounded-2xl border border-border overflow-hidden">
                                <div className="px-5 py-4 border-b border-border">
                                    <h3 className="font-bold text-foreground">Élèves de la classe</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-muted/50 border-b border-border">
                                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Élève</th>
                                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Total payé</th>
                                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Restant dû</th>
                                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Nb paiements</th>
                                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Statut</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {classStudents.map(s => {
                                                const sp = payments.filter(p => p.student_id === s.id);
                                                const paid = sp
                                                    .filter(p => p.status === 'Payé' && p.type === 'Scolarité')
                                                    .reduce((a, p) => a + (p.amount || 0), 0);

                                                // Récupère les frais configurés pour cet élève
                                                const fee = getApplicableFee(s);
                                                const totalDue = fee?.amount || 0;
                                                const remaining = Math.max(0, totalDue - paid);
                                                const hasUnpaid = remaining > 0;

                                                return (
                                                    <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                                        <td className="py-3 px-4 font-medium text-foreground">{s.first_name} {s.last_name}</td>
                                                        <td className="py-3 px-4 text-emerald-600 font-semibold">{paid.toLocaleString()} FCFA</td>
                                                        <td className="py-3 px-4 font-semibold">
                                                            {totalDue > 0
                                                                ? <span className={remaining > 0 ? 'text-red-500' : 'text-emerald-600'}>
                                                                    {remaining > 0 ? `${remaining.toLocaleString()} FCFA` : 'Soldé'}
                                                                </span>
                                                                : <span className="text-muted-foreground/50">Non configuré</span>
                                                            }
                                                        </td>
                                                        <td className="py-3 px-4 text-muted-foreground">{sp.length}</td>
                                                        <td className="py-3 px-4">
                                                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${!hasUnpaid
                                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                                                : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                                                                }`}>
                                                                {hasUnpaid ? 'Impayés' : 'À jour'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </TabsContent>

                {/* Tab 5: Config frais */}
                <TabsContent value="fees" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Définissez les frais de scolarité par classe, niveau ou cycle
                        </p>
                        <Button onClick={openFeeCreate}>
                            <Plus className="w-4 h-4 mr-2" /> Nouvelle configuration
                        </Button>
                    </div>

                    {feeConfigs.length === 0 ? (
                        <EmptyState icon={Settings} title="Aucune configuration"
                            description="Définissez les frais de scolarité pour commencer le suivi." />
                    ) : (
                        <div className="bg-card rounded-xl border border-border overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-muted/50 border-b border-border">
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Cible</th>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Montant total</th>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">T1</th>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">T2</th>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">T3</th>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">Année</th>
                                            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {feeConfigs.map(f => (
                                            <tr key={f.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                                <td className="py-3 px-4 font-medium text-foreground">
                                                    {f.school_classes?.name || f.level || f.cycle || 'Tous'}
                                                    <span className="text-xs text-muted-foreground ml-1">
                                                        {f.class_id ? '(Classe)' : f.level ? '(Niveau)' : f.cycle ? '(Cycle)' : ''}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-muted-foreground">{f.type}</td>
                                                <td className="py-3 px-4 font-semibold text-foreground">{f.amount?.toLocaleString()} FCFA</td>
                                                <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                                                    {f.trimester_1 ? `${f.trimester_1.toLocaleString()} FCFA` : '—'}
                                                </td>
                                                <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                                                    {f.trimester_2 ? `${f.trimester_2.toLocaleString()} FCFA` : '—'}
                                                </td>
                                                <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                                                    {f.trimester_3 ? `${f.trimester_3.toLocaleString()} FCFA` : '—'}
                                                </td>
                                                <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{f.school_year}</td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button size="icon" variant="ghost" onClick={() => openFeeEdit(f)}>
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" onClick={() => setDeleteFeeId(f.id)}>
                                                            <Trash2 className="w-4 h-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Dialog paiement */}
            <Dialog open={dialogOpen} onOpenChange={closeDialog}>
                <DialogContent className="max-w-lg" aria-describedby={undefined}>
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Modifier le paiement' : 'Nouveau paiement'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5 col-span-2">
                                <Label>Élève *</Label>
                                <Select value={form.student_id} onValueChange={handleStudentChange} disabled={!!editingId}>
                                    <SelectTrigger><SelectValue placeholder="Sélectionner un élève" /></SelectTrigger>
                                    <SelectContent>
                                        {students.filter(s => s.status === 'Actif').map(s => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {s.first_name} {s.last_name} — {s.level}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Montant * (FCFA)</Label>
                                <Input type="number" value={form.amount}
                                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Type</Label>
                                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {PAYMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Mode de paiement</Label>
                                <Select value={form.method} onValueChange={v => setForm(f => ({ ...f, method: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Statut</Label>
                                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Payé">Payé</SelectItem>
                                        <SelectItem value="En attente">En attente</SelectItem>
                                        <SelectItem value="Partiel">Partiel</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Trimestre</Label>
                                <Select value={form.trimester} onValueChange={v => setForm(f => ({ ...f, trimester: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {TRIMESTERS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Date</Label>
                                <Input type="date" value={form.payment_date}
                                    onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))} />
                            </div>
                            <div className="space-y-1.5 col-span-2">
                                <Label>Notes</Label>
                                <Textarea value={form.notes}
                                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2 border-t border-border">
                            <Button type="button" variant="outline" onClick={closeDialog}>Annuler</Button>
                            <Button type="submit" disabled={isPending || !form.student_id || !form.amount}>
                                {isPending ? 'Enregistrement...' : editingId ? 'Mettre à jour' : 'Enregistrer'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Dialog config frais */}
            <Dialog open={feeDialogOpen} onOpenChange={closeFeeDialog}>
                <DialogContent className="max-w-lg" aria-describedby={undefined}>
                    <DialogHeader>
                        <DialogTitle>{editingFeeId ? 'Modifier la configuration' : 'Nouvelle configuration de frais'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleFeeSave} className="space-y-4">
                        <div className="bg-muted/40 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">
                                Les frais s'appliquent à tous les élèves du même cycle/niveau. Ex: tous les CP paient le même montant.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Année scolaire</Label>
                                <Input value={feeForm.school_year}
                                    onChange={e => setFeeForm(f => ({ ...f, school_year: e.target.value }))} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Type de frais</Label>
                                <Select value={feeForm.type} onValueChange={v => setFeeForm(f => ({ ...f, type: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {PAYMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Cycle */}
                            <div className="space-y-1.5">
                                <Label>Cycle *</Label>
                                <Select
                                    value={feeForm.cycle || 'none'}
                                    onValueChange={v => setFeeForm(f => ({ ...f, cycle: v === 'none' ? '' : v, level: '' }))}>
                                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Sélectionner</SelectItem>
                                        {CYCLES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Niveau */}
                            <div className="space-y-1.5">
                                <Label>Niveau</Label>
                                <Select
                                    value={feeForm.level || 'none'}
                                    onValueChange={v => setFeeForm(f => ({ ...f, level: v === 'none' ? '' : v }))}
                                    disabled={!feeForm.cycle}>
                                    <SelectTrigger><SelectValue placeholder="Optionnel" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Tous les niveaux du cycle</SelectItem>
                                        {LEVELS_BY_CYCLE[feeForm.cycle]?.map(l => (
                                            <SelectItem key={l} value={l}>{l}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Montants */}
                            <div className="space-y-1.5 col-span-2">
                                <Label>Montant total annuel * (FCFA)</Label>
                                <Input type="number" value={feeForm.amount}
                                    onChange={e => setFeeForm(f => ({ ...f, amount: e.target.value }))} required />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Trimestre 1 (FCFA)</Label>
                                <Input type="number" value={feeForm.trimester_1}
                                    onChange={e => setFeeForm(f => ({ ...f, trimester_1: e.target.value }))}
                                    placeholder="Optionnel" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Trimestre 2 (FCFA)</Label>
                                <Input type="number" value={feeForm.trimester_2}
                                    onChange={e => setFeeForm(f => ({ ...f, trimester_2: e.target.value }))}
                                    placeholder="Optionnel" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Trimestre 3 (FCFA)</Label>
                                <Input type="number" value={feeForm.trimester_3}
                                    onChange={e => setFeeForm(f => ({ ...f, trimester_3: e.target.value }))}
                                    placeholder="Optionnel" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Description</Label>
                                <Input value={feeForm.description}
                                    onChange={e => setFeeForm(f => ({ ...f, description: e.target.value }))}
                                    placeholder="Optionnel" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2 border-t border-border">
                            <Button type="button" variant="outline" onClick={closeFeeDialog}>Annuler</Button>
                            <Button type="submit" disabled={isFeePending || !feeForm.amount || !feeForm.cycle}>
                                {isFeePending ? 'Enregistrement...' : editingFeeId ? 'Mettre à jour' : 'Enregistrer'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
            {/* Alert suppression paiement */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer ce paiement ?</AlertDialogTitle>
                        <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMut.mutate(deleteId)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deleteMut.isPending}>
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Alert suppression config frais */}
            <AlertDialog open={!!deleteFeeId} onOpenChange={() => setDeleteFeeId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cette configuration ?</AlertDialogTitle>
                        <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteFeeMut.mutate(deleteFeeId)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deleteFeeMut.isPending}>
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}