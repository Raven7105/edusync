import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Pencil, Trash2, Users } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import CycleBadge from '@/components/shared/CycleBadge';
import EmptyState from '@/components/shared/EmptyState';
import StudentFormDialog from '@/components/students/StudentFormDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import toast from 'react-hot-toast';
import { fetchStudents, createStudent, updateStudent, deleteStudent } from '@/api/students';
import { fetchClasses } from '@/api/classes';

export default function Students() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [search, setSearch] = useState('');
    const [cycleFilter, setCycleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const queryClient = useQueryClient();

    const { data: students = [], isLoading } = useQuery({
        queryKey: ['students'],
        queryFn: fetchStudents,
    });

    const { data: classes = [] } = useQuery({
        queryKey: ['classes'],
        queryFn: fetchClasses,
    });

    const createMutation = useMutation({
        mutationFn: createStudent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            setDialogOpen(false);
            toast.success('Élève inscrit avec succès');
        },
        onError: () => toast.error("Erreur lors de l'inscription"),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => updateStudent(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            setDialogOpen(false);
            setEditingStudent(null);
            toast.success('Élève mis à jour');
        },
        onError: () => toast.error('Erreur lors de la mise à jour'),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteStudent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            setDeleteId(null);
            toast.success('Élève supprimé');
        },
        onError: () => toast.error('Erreur lors de la suppression'),
    });

    const handleSave = (formData) => {
        if (editingStudent) {
            updateMutation.mutate({ id: editingStudent.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const filtered = students.filter(s => {
        const matchSearch = `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase());
        const matchCycle = cycleFilter === 'all' || s.cycle === cycleFilter;
        const matchStatus = statusFilter === 'all' || s.status === statusFilter;
        return matchSearch && matchCycle && matchStatus;
    });

    const getClassName = (classId) => classes.find(c => c.id === classId)?.name || '—';
    const activeCount = students.filter(s => s.status === 'Actif').length;

    return (
        <div className="space-y-6">
            <PageHeader title="Élèves" subtitle={`${students.length} inscrits · ${activeCount} actifs`}>
                <Button onClick={() => { setEditingStudent(null); setDialogOpen(true); }}>
                    <Plus className="w-4 h-4 mr-2" /> Nouvel élève
                </Button>
            </PageHeader>

            {/* Filtres */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Rechercher un élève..." value={search}
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
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="Actif">Actif</SelectItem>
                        <SelectItem value="Inactif">Inactif</SelectItem>
                        <SelectItem value="Transféré">Transféré</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Contenu */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <p className="text-sm text-muted-foreground">Chargement...</p>
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState icon={Users} title="Aucun élève trouvé"
                    description={search || cycleFilter !== 'all' || statusFilter !== 'all'
                        ? "Aucun résultat pour ces filtres."
                        : "Ajoutez votre premier élève pour commencer."} />
            ) : (
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-muted/50 border-b border-border">
                                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Élève</th>
                                    <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">Cycle</th>
                                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Niveau</th>
                                    <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden lg:table-cell">Classe</th>
                                    <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden lg:table-cell">Parent</th>
                                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Statut</th>
                                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(s => (
                                    <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    {s.photo_url
                                                        ? <img src={s.photo_url} alt="" className="w-full h-full object-cover" />
                                                        : <span className="text-xs font-bold text-muted-foreground">
                                                            {s.first_name?.[0]}{s.last_name?.[0]}
                                                        </span>
                                                    }
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-foreground">{s.first_name} {s.last_name}</p>
                                                    <p className="text-xs text-muted-foreground">{s.gender === 'M' ? 'Garçon' : 'Fille'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 hidden md:table-cell">
                                            <CycleBadge cycle={s.cycle} />
                                        </td>
                                        <td className="py-3 px-4 text-muted-foreground">{s.level}</td>
                                        <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">{getClassName(s.class_id)}</td>
                                        <td className="py-3 px-4 hidden lg:table-cell">
                                            <div>
                                                <p className="text-foreground">{s.parent_name || '—'}</p>
                                                {s.parent_phone && <p className="text-xs text-muted-foreground">{s.parent_phone}</p>}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.status === 'Actif'
                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                                    : s.status === 'Transféré'
                                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                                                        : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                                                }`}>
                                                {s.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button size="icon" variant="ghost"
                                                    onClick={() => { setEditingStudent(s); setDialogOpen(true); }}>
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost"
                                                    onClick={() => setDeleteId(s.id)}>
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
                            {filtered.length} élève{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
                            {filtered.length !== students.length && ` sur ${students.length}`}
                        </p>
                    </div>
                </div>
            )}

            <StudentFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                student={editingStudent}
                classes={classes}
                onSave={handleSave}
            />

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cet élève ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. Toutes les données liées seront supprimées.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteMutation.mutate(deleteId)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}