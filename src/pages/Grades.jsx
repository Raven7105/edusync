import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, ClipboardList, Trash2, Pencil } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import toast from 'react-hot-toast';

const SUBJECTS = [
    'Français', 'Mathématiques', 'Sciences', 'Histoire-Géo', 'Anglais',
    'EPS', 'Arts', 'Musique', 'Technologie', 'SVT', 'Physique-Chimie'
];

const isCollege = (cycle) => cycle === 'Collège';

const EMPTY_FORM = {
    student_id: '', student_name: '', class_id: '', cycle: '',
    subject: 'Français', teacher_name: '',
    note_evaluation: '', note_examen: '',
    note_devoir: '', coef_devoir: 1,
    coef_examen: 1, grade: '',
    coefficient: 1, trimester: 'Trimestre 1',
    school_year: '2025-2026', comment: '',
};

function calcAutoGrade(f, college) {
    const hasVal = v => v !== '' && v !== null && v !== undefined;

    if (college) {
        const parts = [];
        if (hasVal(f.note_evaluation)) parts.push({ v: Number(f.note_evaluation), c: 1 });
        if (hasVal(f.note_devoir)) parts.push({ v: Number(f.note_devoir), c: Number(f.coef_devoir) || 1 });
        if (hasVal(f.note_examen)) parts.push({ v: Number(f.note_examen), c: Number(f.coef_examen) || 1 });
        if (!parts.length) return '';
        const totalCoef = parts.reduce((s, p) => s + p.c, 0);
        const totalVal = parts.reduce((s, p) => s + p.v * p.c, 0);
        return parseFloat((totalVal / totalCoef).toFixed(2));
    }

    // Primaire/Maternelle : seulement évaluation + composition
    const vals = [f.note_evaluation, f.note_examen].filter(hasVal).map(Number);
    if (!vals.length) return '';
    return parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2));
}

function getGradeColor(grade) {
    if (grade >= 16) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400';
    if (grade >= 12) return 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400';
    if (grade >= 10) return 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400';
    return 'text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400';
}

export default function Grades() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [search, setSearch] = useState('');
    const [trimesterFilter, setTrimesterFilter] = useState('all');
    const [subjectFilter, setSubjectFilter] = useState('all');
    const [form, setForm] = useState(EMPTY_FORM);
    const queryClient = useQueryClient();

    const { data: grades = [], isLoading } = useQuery({
        queryKey: ['grades'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('grades')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        },
    });

    const { data: students = [] } = useQuery({
        queryKey: ['students'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .order('last_name', { ascending: true });
            if (error) throw error;
            return data || [];
        },
    });

    const createMut = useMutation({
        mutationFn: async (payload) => {
            const { error } = await supabase.from('grades').insert([payload]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['grades'] });
            closeDialog();
            toast.success('Note enregistrée');
        },
        onError: () => toast.error("Impossible d'enregistrer la note"),
    });

    const updateMut = useMutation({
        mutationFn: async ({ id, payload }) => {
            const { error } = await supabase.from('grades').update(payload).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['grades'] });
            closeDialog();
            toast.success('Note mise à jour');
        },
        onError: () => toast.error('Impossible de mettre à jour la note'),
    });

    const deleteMut = useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase.from('grades').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['grades'] });
            setDeleteId(null);
            toast.success('Note supprimée');
        },
        onError: () => toast.error('Impossible de supprimer la note'),
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

    const openEdit = (grade) => {
        const student = students.find(s => s.id === grade.student_id);
        setEditingId(grade.id);
        setForm({
            student_id: grade.student_id || '',
            student_name: grade.student_name || `${student?.first_name || ''} ${student?.last_name || ''}`.trim(),
            class_id: grade.class_id || student?.class_id || '',
            cycle: grade.cycle || student?.cycle || '',
            subject: grade.subject || 'Français',
            teacher_name: grade.teacher_name || '',
            note_evaluation: grade.note_evaluation ?? '',
            note_examen: grade.note_examen ?? '',
            note_devoir: grade.note_devoir ?? '',
            coef_devoir: grade.coef_devoir ?? 1,
            coef_examen: grade.coef_examen ?? 1,
            grade: grade.grade ?? '',
            coefficient: grade.coefficient || 1,
            trimester: grade.trimester || 'Trimestre 1',
            school_year: grade.school_year || '2025-2026',
            comment: grade.comment || '',
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
            cycle: student?.cycle || '',
        }));
    };

    const college = isCollege(form.cycle);
    const autoGrade = calcAutoGrade(form, college);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.student_id) { toast.error('Sélectionnez un élève'); return; }

        if (!editingId) {
            const duplicate = grades.find(g =>
                g.student_id === form.student_id &&
                g.subject === form.subject &&
                g.trimester === form.trimester
            );
            if (duplicate) {
                toast.error(`Une note pour « ${form.subject} » au ${form.trimester} existe déjà.`);
                return;
            }
        }

        const finalGrade = form.grade !== '' ? parseFloat(form.grade) : (autoGrade !== '' ? autoGrade : 0);

        const payload = {
            ...form,
            grade: finalGrade,
            note_evaluation: form.note_evaluation !== '' ? parseFloat(form.note_evaluation) : null,
            note_examen: form.note_examen !== '' ? parseFloat(form.note_examen) : null,
            note_devoir: college && form.note_devoir !== '' ? parseFloat(form.note_devoir) : null,
            coef_devoir: college ? Number(form.coef_devoir) || 1 : null,
            coef_examen: college ? Number(form.coef_examen) || 1 : null,
        };

        if (editingId) {
            updateMut.mutate({ id: editingId, payload });
        } else {
            createMut.mutate(payload);
        }
    };

    const filtered = grades.filter(g => {
        const matchSearch = g.student_name?.toLowerCase().includes(search.toLowerCase()) ||
            g.subject?.toLowerCase().includes(search.toLowerCase());
        const matchTrimester = trimesterFilter === 'all' || g.trimester === trimesterFilter;
        const matchSubject = subjectFilter === 'all' || g.subject === subjectFilter;
        return matchSearch && matchTrimester && matchSubject;
    });

    const isPending = createMut.isPending || updateMut.isPending || deleteMut.isPending;

    return (
        <div className="space-y-6">
            <PageHeader title="Notes" subtitle={`${grades.length} notes enregistrées`}>
                <Button onClick={openCreate}>
                    <Plus className="w-4 h-4 mr-2" /> Saisir une note
                </Button>
            </PageHeader>

            {/* Filtres */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Rechercher par élève ou matière..."
                        value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={trimesterFilter} onValueChange={setTrimesterFilter}>
                    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les trimestres</SelectItem>
                        <SelectItem value="Trimestre 1">Trimestre 1</SelectItem>
                        <SelectItem value="Trimestre 2">Trimestre 2</SelectItem>
                        <SelectItem value="Trimestre 3">Trimestre 3</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Toutes les matières</SelectItem>
                        {SUBJECTS.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Tableau */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <p className="text-sm text-muted-foreground">Chargement...</p>
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState icon={ClipboardList} title="Aucune note"
                    description="Saisissez la première note." />
            ) : (
                <>
                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-muted/50 border-b border-border">
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Élève</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Matière</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden sm:table-cell">Décomposition</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Moy.</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">Coef.</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">Trimestre</th>
                                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(g => {
                                        const student = students.find(s => s.id === g.student_id);
                                        const col = isCollege(student?.cycle || g.cycle);
                                        const parts = [];
                                        if (g.note_evaluation != null) parts.push(col ? `Év:${g.note_evaluation}(×1)` : `Év:${g.note_evaluation}`);
                                        if (col && g.note_devoir != null) parts.push(`Dev:${g.note_devoir}(×${g.coef_devoir || 1})`);
                                        if (g.note_examen != null) parts.push(col ? `Comp:${g.note_examen}(×${g.coef_examen || 1})` : `Comp:${g.note_examen}`);

                                        return (
                                            <tr key={g.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                                <td className="py-3 px-4 font-medium text-foreground">{g.student_name}</td>
                                                <td className="py-3 px-4 text-muted-foreground">{g.subject}</td>
                                                <td className="py-3 px-4 text-xs text-muted-foreground hidden sm:table-cell">
                                                    {parts.length ? parts.join(' · ') : '—'}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`font-bold px-2 py-0.5 rounded text-xs ${getGradeColor(g.grade)}`}>
                                                        {g.grade}/20
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{g.coefficient}</td>
                                                <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{g.trimester}</td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button size="icon" variant="ghost" onClick={() => openEdit(g)}>
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" onClick={() => setDeleteId(g.id)}>
                                                            <Trash2 className="w-4 h-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-4 py-3 border-t border-border bg-muted/30">
                            <p className="text-xs text-muted-foreground">
                                {filtered.length} note{filtered.length > 1 ? 's' : ''} affichée{filtered.length > 1 ? 's' : ''}
                                {filtered.length !== grades.length && ` sur ${grades.length}`}
                            </p>
                        </div>
                    </div>
                </>
            )}

            {/* Dialog */}
            <Dialog open={dialogOpen} onOpenChange={closeDialog}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Modifier la note' : 'Saisir une note'}</DialogTitle>
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
                                            {s.first_name} {s.last_name} — {s.level} ({s.cycle})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {form.cycle && (
                                <p className="text-xs text-muted-foreground">
                                    Cycle : <strong>{form.cycle}</strong> →
                                    {college ? ' Collège (Éval · Devoir · Composition)' : ' Primaire/Maternelle (Évaluation · Composition)'}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Matière */}
                            <div className="space-y-1.5">
                                <Label>Matière *</Label>
                                <Select value={form.subject} onValueChange={v => setForm(f => ({ ...f, subject: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Trimestre */}
                            <div className="space-y-1.5">
                                <Label>Trimestre</Label>
                                <Select value={form.trimester} onValueChange={v => setForm(f => ({ ...f, trimester: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Trimestre 1">Trimestre 1</SelectItem>
                                        <SelectItem value="Trimestre 2">Trimestre 2</SelectItem>
                                        <SelectItem value="Trimestre 3">Trimestre 3</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Professeur */}
                            <div className="space-y-1.5 col-span-2">
                                <Label>Professeur</Label>
                                <Input value={form.teacher_name}
                                    onChange={e => setForm(f => ({ ...f, teacher_name: e.target.value }))}
                                    placeholder="Nom du professeur" />
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="bg-muted/40 rounded-lg p-4 space-y-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Saisie des notes (partielle autorisée)
                            </p>

                            {college ? (
                                // Collège : Éval + Devoir + Composition avec coefs
                                <div className="space-y-3">
                                    <div className="grid grid-cols-4 gap-2 items-end">
                                        <div className="col-span-3 space-y-1">
                                            <Label className="text-xs">Évaluation /20</Label>
                                            <Input type="number" min="0" max="20" step="0.5"
                                                value={form.note_evaluation}
                                                onChange={e => setForm(f => ({ ...f, note_evaluation: e.target.value }))}
                                                placeholder="—" className="h-8 text-sm" />
                                        </div>
                                        <div className="space-y-1 opacity-50">
                                            <Label className="text-xs">Coef</Label>
                                            <Input value="1" disabled className="h-8 text-sm" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 items-end">
                                        <div className="col-span-3 space-y-1">
                                            <Label className="text-xs">Devoir /20</Label>
                                            <Input type="number" min="0" max="20" step="0.5"
                                                value={form.note_devoir}
                                                onChange={e => setForm(f => ({ ...f, note_devoir: e.target.value }))}
                                                placeholder="—" className="h-8 text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Coef</Label>
                                            <Input type="number" min="1" max="10"
                                                value={form.coef_devoir}
                                                onChange={e => setForm(f => ({ ...f, coef_devoir: e.target.value }))}
                                                className="h-8 text-sm" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 items-end">
                                        <div className="col-span-3 space-y-1">
                                            <Label className="text-xs">Composition /20</Label>
                                            <Input type="number" min="0" max="20" step="0.5"
                                                value={form.note_examen}
                                                onChange={e => setForm(f => ({ ...f, note_examen: e.target.value }))}
                                                placeholder="—" className="h-8 text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Coef</Label>
                                            <Input type="number" min="1" max="10"
                                                value={form.coef_examen}
                                                onChange={e => setForm(f => ({ ...f, coef_examen: e.target.value }))}
                                                className="h-8 text-sm" />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // Primaire/Maternelle : Évaluation + Composition seulement
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Évaluation /20</Label>
                                        <Input type="number" min="0" max="20" step="0.5"
                                            value={form.note_evaluation}
                                            onChange={e => setForm(f => ({ ...f, note_evaluation: e.target.value }))}
                                            placeholder="—" className="h-8 text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Composition /20</Label>
                                        <Input type="number" min="0" max="20" step="0.5"
                                            value={form.note_examen}
                                            onChange={e => setForm(f => ({ ...f, note_examen: e.target.value }))}
                                            placeholder="—" className="h-8 text-sm" />
                                    </div>
                                </div>
                            )}

                            {/* Moyenne calculée */}
                            {autoGrade !== '' && (
                                <div className="border-t border-border/50 pt-2">
                                    <p className="text-xs font-semibold text-primary">
                                        Moyenne calculée : <strong>{autoGrade}/20</strong>
                                        {college && (
                                            <span className="text-muted-foreground font-normal ml-1">
                                                = Σ(note × coef) / Σcoef
                                            </span>
                                        )}
                                        {!college && (
                                            <span className="text-muted-foreground font-normal ml-1">
                                                = (Éval + Comp) / nb notes
                                            </span>
                                        )}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Moyenne manuelle */}
                            <div className="space-y-1.5">
                                <Label>
                                    Moy. matière /20
                                    <span className="text-muted-foreground text-xs ml-1">(override)</span>
                                </Label>
                                <Input type="number" min="0" max="20" step="0.01"
                                    value={form.grade}
                                    onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}
                                    placeholder={autoGrade !== '' ? String(autoGrade) : 'auto'} />
                            </div>

                            {/* Coefficient matière */}
                            <div className="space-y-1.5">
                                <Label>Coefficient matière</Label>
                                <Input type="number" min="1" value={form.coefficient}
                                    onChange={e => setForm(f => ({ ...f, coefficient: parseInt(e.target.value) || 1 }))} />
                            </div>
                        </div>

                        {/* Appréciation */}
                        <div className="space-y-1.5">
                            <Label>Appréciation</Label>
                            <Textarea value={form.comment}
                                onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
                                rows={2} placeholder="Commentaire du professeur..." />
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

            {/* Suppression */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cette note ?</AlertDialogTitle>
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