import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, School, Users, Search } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import CycleBadge from '@/components/shared/CycleBadge';
import EmptyState from '@/components/shared/EmptyState';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import toast from 'react-hot-toast';
import { fetchClasses, createClass, updateClass, deleteClass } from '@/api/classes';
import { fetchTeachers } from '@/api/teachers';
import { fetchStudents } from '@/api/students';

const LEVELS_BY_CYCLE = {
    Maternelle: ['Petite Section', 'Moyenne Section', 'Grande Section'],
    Primaire: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
    Collège: ['6ème', '5ème', '4ème', '3ème'],
};

const DEFAULT_FORM = {
    name: '', cycle: 'Primaire', level: 'CP',
    teacher_id: '', capacity: 30, room: '', school_year: '2025-2026',
};

export default function Classes() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [form, setForm] = useState(DEFAULT_FORM);
    const [search, setSearch] = useState('');
    const [cycleFilter, setCycleFilter] = useState('all');
    const queryClient = useQueryClient();

    const { data: classes = [], isLoading } = useQuery({
        queryKey: ['classes'],
        queryFn: fetchClasses,
    });

    const { data: teachers = [] } = useQuery({
        queryKey: ['teachers'],
        queryFn: fetchTeachers,
    });

    const { data: students = [] } = useQuery({
        queryKey: ['students'],
        queryFn: fetchStudents,
    });

    const createMut = useMutation({
        mutationFn: createClass,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['classes'] });
            setDialogOpen(false);
            setForm(DEFAULT_FORM);
            toast.success('Classe créée');
        },
        onError: () => toast.error('Erreur lors de la création'),
    });

    const updateMut = useMutation({
        mutationFn: ({ id, data }) => updateClass(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['classes'] });
            setDialogOpen(false);
            setEditing(null);
            setForm(DEFAULT_FORM);
            toast.success('Classe mise à jour');
        },
        onError: () => toast.error('Erreur lors de la mise à jour'),
    });

    const deleteMut = useMutation({
        mutationFn: deleteClass,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['classes'] });
            setDeleteId(null);
            toast.success('Classe supprimée');
        },
        onError: () => toast.error('Erreur lors de la suppression'),
    });

    const openNew = () => {
        setEditing(null);
        setForm(DEFAULT_FORM);
        setDialogOpen(true);
    };

    const openEdit = (c) => {
        setEditing(c);
        setForm({
            name: c.name || '',
            cycle: c.cycle || 'Primaire',
            level: c.level || 'CP',
            teacher_id: c.teacher_id || '',
            capacity: c.capacity || 30,
            room: c.room || '',
            school_year: c.school_year || '2025-2026',
        });
        setDialogOpen(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        const payload = {
            ...form,
            teacher_id: form.teacher_id || null,
        };
        if (editing) {
            updateMut.mutate({ id: editing.id, data: payload });
        } else {
            createMut.mutate(payload);
        }
    };

    const getTeacherName = (id) => {
        const t = teachers.find(t => t.id === id);
        return t ? `${t.first_name} ${t.last_name}` : '—';
    };

    const getStudentCount = (classId) => students.filter(s => s.class_id === classId).length;

    const filtered = classes.filter(c => {
        const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
        const matchCycle = cycleFilter === 'all' || c.cycle === cycleFilter;
        return matchSearch && matchCycle;
    });

    return (
        <div className="space-y-6">
            <PageHeader title="Classes" subtitle={`${classes.length} classes`}>
                <Button onClick={openNew}>
                    <Plus className="w-4 h-4 mr-2" /> Nouvelle classe
                </Button>
            </PageHeader>

            {/* Filtres */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Rechercher une classe..." value={search}
                        onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={cycleFilter} onValueChange={setCycleFilter}>
                    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les cycles</SelectItem>
                        <SelectItem value="Maternelle">Maternelle</SelectItem>
                        <SelectItem value="Primaire">Primaire</SelectItem>
                        <SelectItem value="Collège">Collège</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Contenu */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <p className="text-sm text-muted-foreground">Chargement...</p>
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState icon={School} title="Aucune classe trouvée"
                    description={search || cycleFilter !== 'all'
                        ? "Aucun résultat pour ces filtres."
                        : "Créez votre première classe."} />
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map(c => {
                            const studentCount = getStudentCount(c.id);
                            const capacity = c.capacity || 1;
                            const fillPercent = Math.min((studentCount / capacity) * 100, 100);
                            const isFull = studentCount >= capacity;

                            return (
                                <div key={c.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-lg transition-all duration-200">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="font-bold text-xl text-foreground">{c.name}</h3>
                                            <p className="text-sm text-muted-foreground">{c.level} · {c.school_year}</p>
                                        </div>
                                        <CycleBadge cycle={c.cycle} />
                                    </div>

                                    <div className="space-y-2 text-sm mb-4">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Enseignant</span>
                                            <span className="font-medium text-foreground">{getTeacherName(c.teacher_id)}</span>
                                        </div>
                                        {c.room && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Salle</span>
                                                <span className="font-medium text-foreground">{c.room}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <div className="flex justify-between text-sm mb-1.5">
                                            <span className="text-muted-foreground flex items-center gap-1">
                                                <Users className="w-3.5 h-3.5" /> Effectif
                                            </span>
                                            <span className={`font-semibold ${isFull ? 'text-red-600' : 'text-foreground'}`}>
                                                {studentCount} / {c.capacity || '—'}
                                            </span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2">
                                            <div
                                                className={`rounded-full h-2 transition-all duration-300 ${isFull ? 'bg-red-500' :
                                                        fillPercent > 80 ? 'bg-amber-500' : 'bg-primary'
                                                    }`}
                                                style={{ width: `${fillPercent}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-1 border-t border-border pt-3">
                                        <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>
                                            <Pencil className="w-3.5 h-3.5 mr-1" /> Modifier
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => setDeleteId(c.id)}>
                                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {filtered.length} classe{filtered.length > 1 ? 's' : ''} affichée{filtered.length > 1 ? 's' : ''}
                        {filtered.length !== classes.length && ` sur ${classes.length}`}
                    </p>
                </>
            )}

            {/* Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Modifier la classe' : 'Nouvelle classe'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Nom *</Label>
                                <Input value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    placeholder="Ex: CP-A" required />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Année scolaire</Label>
                                <Input value={form.school_year}
                                    onChange={e => setForm({ ...form, school_year: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Cycle</Label>
                                <Select value={form.cycle} onValueChange={v => setForm({
                                    ...form, cycle: v, level: LEVELS_BY_CYCLE[v][0]
                                })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Maternelle">Maternelle</SelectItem>
                                        <SelectItem value="Primaire">Primaire</SelectItem>
                                        <SelectItem value="Collège">Collège</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Niveau</Label>
                                <Select value={form.level}
                                    onValueChange={v => setForm({ ...form, level: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {LEVELS_BY_CYCLE[form.cycle]?.map(l => (
                                            <SelectItem key={l} value={l}>{l}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Enseignant principal</Label>
                                <Select value={form.teacher_id}
                                    onValueChange={v => setForm({ ...form, teacher_id: v })}>
                                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                                    <SelectContent>
                                        {teachers.filter(t => t.status === 'Actif').map(t => (
                                            <SelectItem key={t.id} value={t.id}>
                                                {t.first_name} {t.last_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Capacité max</Label>
                                <Input type="number" value={form.capacity}
                                    onChange={e => setForm({ ...form, capacity: Number(e.target.value) || 0 })} />
                            </div>
                            <div className="space-y-1.5 col-span-2">
                                <Label>Salle</Label>
                                <Input value={form.room}
                                    onChange={e => setForm({ ...form, room: e.target.value })}
                                    placeholder="Ex: Salle 12" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2 border-t border-border">
                            <Button type="button" variant="outline"
                                onClick={() => setDialogOpen(false)}>Annuler</Button>
                            <Button type="submit" disabled={!form.name.trim()}>
                                {editing ? 'Enregistrer' : 'Créer'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cette classe ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. Les élèves ne seront pas supprimés.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMut.mutate(deleteId)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}