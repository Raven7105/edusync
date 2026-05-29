import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, CalendarX, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const EMPTY_FORM = {
    student_id: '', student_name: '', class_id: '',
    date: new Date().toISOString().split('T')[0],
    session: 'Journée', justified: false, reason: '', school_year: '2025-2026',
};

export default function Absences() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [search, setSearch] = useState('');
    const [justifiedFilter, setJustifiedFilter] = useState('all');
    const [form, setForm] = useState(EMPTY_FORM);
    const qc = useQueryClient();

    const { data: absences = [] } = useQuery({ queryKey: ['absences'], queryFn: () => base44.entities.Absence.list('-created_date') });
    const { data: students = [] } = useQuery({ queryKey: ['students'], queryFn: () => base44.entities.Student.list() });

    const createMut = useMutation({
        mutationFn: d => base44.entities.Absence.create(d),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['absences'] }); setDialogOpen(false); setForm(EMPTY_FORM); },
    });
    const updateMut = useMutation({
        mutationFn: ({ id, d }) => base44.entities.Absence.update(id, d),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['absences'] }),
    });
    const deleteMut = useMutation({
        mutationFn: id => base44.entities.Absence.delete(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['absences'] }); setDeleteId(null); },
    });

    const handleStudentChange = (sid) => {
        const s = students.find(st => st.id === sid);
        setForm(f => ({ ...f, student_id: sid, student_name: s ? `${s.first_name} ${s.last_name}` : '', class_id: s?.class_id || '' }));
    };

    const handleSave = (e) => {
        e.preventDefault();
        createMut.mutate(form);
    };

    const filtered = absences.filter(a => {
        const matchSearch = a.student_name?.toLowerCase().includes(search.toLowerCase());
        const matchJustified = justifiedFilter === 'all' || (justifiedFilter === 'justified' ? a.justified : !a.justified);
        return matchSearch && matchJustified;
    });

    const totalAbsences = absences.length;
    const justified = absences.filter(a => a.justified).length;
    const unjustified = absences.filter(a => !a.justified).length;

    return (
        <div className="space-y-6">
            <PageHeader title="Absences" subtitle="Suivi des absences des élèves">
                <Button onClick={() => { setForm(EMPTY_FORM); setDialogOpen(true); }}>
                    <Plus className="w-4 h-4 mr-2" />Nouvelle absence
                </Button>
            </PageHeader>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="text-xs text-muted-foreground font-medium">Total absences</div>
                    <div className="text-2xl font-bold text-foreground mt-1">{totalAbsences}</div>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <div className="text-xs text-emerald-600 font-medium">Justifiées</div>
                    <div className="text-2xl font-bold text-emerald-700 mt-1">{justified}</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="text-xs text-red-600 font-medium">Non justifiées</div>
                    <div className="text-2xl font-bold text-red-700 mt-1">{unjustified}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Rechercher un élève..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={justifiedFilter} onValueChange={setJustifiedFilter}>
                    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Toutes les absences</SelectItem>
                        <SelectItem value="justified">Justifiées</SelectItem>
                        <SelectItem value="unjustified">Non justifiées</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {filtered.length === 0 ? (
                <EmptyState icon={CalendarX} title="Aucune absence" description="Enregistrez la première absence." />
            ) : (
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-muted/50 border-b border-border">
                                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Élève</th>
                                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                                    <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden sm:table-cell">Session</th>
                                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Statut</th>
                                    <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">Motif</th>
                                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(a => (
                                    <tr key={a.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                        <td className="py-3 px-4 font-medium">{a.student_name}</td>
                                        <td className="py-3 px-4 text-muted-foreground">
                                            {a.date ? format(new Date(a.date), 'dd MMM yyyy', { locale: fr }) : '—'}
                                        </td>
                                        <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">{a.session}</td>
                                        <td className="py-3 px-4">
                                            <button
                                                onClick={() => updateMut.mutate({ id: a.id, d: { justified: !a.justified } })}
                                                className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${a.justified ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                    }`}
                                            >
                                                {a.justified ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                                {a.justified ? 'Justifiée' : 'Non justifiée'}
                                            </button>
                                        </td>
                                        <td className="py-3 px-4 text-muted-foreground text-xs hidden md:table-cell">{a.reason || '—'}</td>
                                        <td className="py-3 px-4 text-right">
                                            <Button size="icon" variant="ghost" onClick={() => setDeleteId(a.id)}>
                                                <Trash2 className="w-4 h-4 text-destructive" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Nouvelle absence</DialogTitle></DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Élève *</Label>
                            <Select value={form.student_id} onValueChange={handleStudentChange}>
                                <SelectTrigger><SelectValue placeholder="Sélectionner un élève" /></SelectTrigger>
                                <SelectContent>
                                    {students.filter(s => s.status === 'Actif').map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name} — {s.level}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Date *</Label>
                                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
                            </div>
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
                        <div className="space-y-1.5">
                            <Label>Motif (optionnel)</Label>
                            <Input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Raison de l'absence..." />
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="justified" checked={form.justified}
                                onChange={e => setForm(f => ({ ...f, justified: e.target.checked }))}
                                className="w-4 h-4 rounded border-gray-300" />
                            <label htmlFor="justified" className="text-sm text-foreground">Absence justifiée</label>
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
                            <Button type="submit" disabled={!form.student_id || createMut.isPending}>
                                {createMut.isPending ? 'Enregistrement...' : 'Enregistrer'}
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
                        <AlertDialogAction onClick={() => deleteMut.mutate(deleteId)} className="bg-destructive text-destructive-foreground">Supprimer</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}