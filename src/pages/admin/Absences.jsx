import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Search, CalendarX, Trash2, Pencil, CheckCircle2, XCircle } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import toast from 'react-hot-toast';
import { fetchAbsences, createAbsence, updateAbsence, deleteAbsence } from '@/api/absences';
import { fetchStudents } from '@/api/students';
import { fetchClasses } from '@/api/classes';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const EMPTY_FORM = {
    student_id: '', student_name: '', class_id: '',
    date: new Date().toISOString().split('T')[0],
    session: 'Journée', justified: false,
    reason: '', school_year: '2025-2026',
};

export default function Absences() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [search, setSearch] = useState('');
    const [sessionFilter, setSessionFilter] = useState('all');
    const [justifiedFilter, setJustifiedFilter] = useState('all');
    const [classFilter, setClassFilter] = useState('all');
    const [form, setForm] = useState(EMPTY_FORM);
    const queryClient = useQueryClient();

    const { data: absences = [], isLoading } = useQuery({
        queryKey: ['absences'],
        queryFn: fetchAbsences,
    });

    const { data: students = [] } = useQuery({
        queryKey: ['students'],
        queryFn: fetchStudents,
    });

    const { data: classes = [] } = useQuery({
        queryKey: ['classes'],
        queryFn: fetchClasses,
    });

    const createMut = useMutation({
        mutationFn: createAbsence,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['absences'] });
            closeDialog();
            toast.success('Absence enregistrée');
        },
        onError: () => toast.error("Erreur lors de l'enregistrement"),
    });

    const updateMut = useMutation({
        mutationFn: ({ id, data }) => updateAbsence(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['absences'] });
            closeDialog();
            toast.success('Absence mise à jour');
        },
        onError: () => toast.error('Erreur lors de la mise à jour'),
    });

    const deleteMut = useMutation({
        mutationFn: deleteAbsence,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['absences'] });
            setDeleteId(null);
            toast.success('Absence supprimée');
        },
        onError: () => toast.error('Erreur lors de la suppression'),
    });

    const closeDialog = () => {
        setDialogOpen(false);
        setEditingId(null);
        setForm(EMPTY_FORM);
    };

    const openCreate = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setDialogOpen(true);
    };

    const openEdit = (absence) => {
        setEditingId(absence.id);
        setForm({
            student_id: absence.student_id || '',
            student_name: absence.student_name || '',
            class_id: absence.class_id || '',
            date: absence.date || new Date().toISOString().split('T')[0],
            session: absence.session || 'Journée',
            justified: absence.justified || false,
            reason: absence.reason || '',
            school_year: absence.school_year || '2025-2026',
        });
        setDialogOpen(true);
    };

    const handleStudentChange = (studentId) => {
        const student = students.find(s => s.id === studentId);
        setForm(f => ({
            ...f,
            student_id: studentId,
            student_name: student ? `${student.first_name} ${student.last_name}` : '',
            class_id: student?.class_id || '',
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.student_id) { toast.error('Sélectionnez un élève'); return; }

        const payload = {
            ...form,
            class_id: form.class_id || null,
        };

        if (editingId) {
            updateMut.mutate({ id: editingId, data: payload });
        } else {
            createMut.mutate(payload);
        }
    };

    const getClassName = (classId) => classes.find(c => c.id === classId)?.name || '—';

    const filtered = absences.filter(a => {
        const matchSearch = a.student_name?.toLowerCase().includes(search.toLowerCase());
        const matchSession = sessionFilter === 'all' || a.session === sessionFilter;
        const matchJustified = justifiedFilter === 'all' ||
            (justifiedFilter === 'justified' ? a.justified : !a.justified);
        const matchClass = classFilter === 'all' || a.class_id === classFilter;
        return matchSearch && matchSession && matchJustified && matchClass;
    });

    const totalAbsences = absences.length;
    const justifiedCount = absences.filter(a => a.justified).length;
    const unjustifiedCount = absences.filter(a => !a.justified).length;

    const isPending = createMut.isPending || updateMut.isPending;

    return (
        <div className="space-y-6">
            <PageHeader title="Absences" subtitle={`${totalAbsences} absences enregistrées`}>
                <Button onClick={openCreate}>
                    <Plus className="w-4 h-4 mr-2" /> Nouvelle absence
                </Button>
            </PageHeader>

            {/* Stats rapides */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <CalendarX className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-extrabold text-foreground">{totalAbsences}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-extrabold text-foreground">{justifiedCount}</p>
                        <p className="text-xs text-muted-foreground">Justifiées</p>
                    </div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                        <XCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-extrabold text-foreground">{unjustifiedCount}</p>
                        <p className="text-xs text-muted-foreground">Non justifiées</p>
                    </div>
                </div>
            </div>

            {/* Filtres */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Rechercher un élève..."
                        value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={classFilter} onValueChange={setClassFilter}>
                    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Toutes les classes</SelectItem>
                        {classes.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={sessionFilter} onValueChange={setSessionFilter}>
                    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Toutes les sessions</SelectItem>
                        <SelectItem value="Matin">Matin</SelectItem>
                        <SelectItem value="Après-midi">Après-midi</SelectItem>
                        <SelectItem value="Journée">Journée</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={justifiedFilter} onValueChange={setJustifiedFilter}>
                    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Toutes</SelectItem>
                        <SelectItem value="justified">Justifiées</SelectItem>
                        <SelectItem value="unjustified">Non justifiées</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Tableau */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <p className="text-sm text-muted-foreground">Chargement...</p>
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState icon={CalendarX} title="Aucune absence trouvée"
                    description={search || sessionFilter !== 'all' || justifiedFilter !== 'all'
                        ? "Aucun résultat pour ces filtres."
                        : "Enregistrez la première absence."} />
            ) : (
                <>
                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-muted/50 border-b border-border">
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Élève</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">Classe</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden sm:table-cell">Session</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Statut</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden lg:table-cell">Motif</th>
                                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(a => (
                                        <tr key={a.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${a.justified ? 'bg-emerald-100 dark:bg-emerald-950/40' : 'bg-red-100 dark:bg-red-950/40'
                                                        }`}>
                                                        {a.justified
                                                            ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                            : <XCircle className="w-4 h-4 text-red-600" />
                                                        }
                                                    </div>
                                                    <p className="font-semibold text-foreground">{a.student_name}</p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                                                {getClassName(a.class_id)}
                                            </td>
                                            <td className="py-3 px-4 text-muted-foreground">
                                                {a.date ? format(new Date(a.date), 'dd MMM yyyy', { locale: fr }) : '—'}
                                            </td>
                                            <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">
                                                {a.session}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${a.justified
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                                        : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                                                    }`}>
                                                    {a.justified ? 'Justifiée' : 'Non justifiée'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">
                                                {a.reason || '—'}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button size="icon" variant="ghost" onClick={() => openEdit(a)}>
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" onClick={() => setDeleteId(a.id)}>
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
                                {filtered.length} absence{filtered.length > 1 ? 's' : ''} affichée{filtered.length > 1 ? 's' : ''}
                                {filtered.length !== absences.length && ` sur ${absences.length}`}
                            </p>
                        </div>
                    </div>
                </>
            )}

            {/* Dialog */}
            <Dialog open={dialogOpen} onOpenChange={closeDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Modifier l'absence" : "Nouvelle absence"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4">

                        {/* Élève */}
                        <div className="space-y-1.5">
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

                        <div className="grid grid-cols-2 gap-4">
                            {/* Date */}
                            <div className="space-y-1.5">
                                <Label>Date *</Label>
                                <Input type="date" value={form.date}
                                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
                            </div>

                            {/* Session */}
                            <div className="space-y-1.5">
                                <Label>Session</Label>
                                <Select value={form.session} onValueChange={v => setForm(f => ({ ...f, session: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Matin">Matin</SelectItem>
                                        <SelectItem value="Après-midi">Après-midi</SelectItem>
                                        <SelectItem value="Journée">Journée entière</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Motif */}
                        <div className="space-y-1.5">
                            <Label>Motif</Label>
                            <Input value={form.reason}
                                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                                placeholder="Ex: Maladie, Voyage..." />
                        </div>

                        {/* Justifiée */}
                        <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
                            <Checkbox
                                id="justified"
                                checked={form.justified}
                                onCheckedChange={v => setForm(f => ({ ...f, justified: v }))}
                            />
                            <label htmlFor="justified" className="text-sm font-medium cursor-pointer">
                                Absence justifiée
                            </label>
                        </div>

                        <div className="flex justify-end gap-3 pt-2 border-t border-border">
                            <Button type="button" variant="outline" onClick={closeDialog}>Annuler</Button>
                            <Button type="submit" disabled={isPending || !form.student_id}>
                                {isPending ? 'Enregistrement...' : editingId ? 'Mettre à jour' : 'Enregistrer'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cette absence ?</AlertDialogTitle>
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
        </div>
    );
}