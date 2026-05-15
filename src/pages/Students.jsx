import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Pencil, Trash2, Users } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import CycleBadge from '@/components/shared/CycleBadge';
import EmptyState from '@/components/shared/EmptyState';
import StudentFormDialog from '@/components/students/StudentFormDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function Students() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [search, setSearch] = useState('');
    const [cycleFilter, setCycleFilter] = useState('all');
    const queryClient = useQueryClient();

    const { data: students = [], isLoading } = useQuery({
        queryKey: ['students'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .order('created_date', { ascending: false });
            if (error) throw error;
            return data || [];
        },
    });

    const { data: classes = [] } = useQuery({
        queryKey: ['classes'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('school_classes')
                .select('*');
            if (error) throw error;
            return data || [];
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data) => {
            const { error } = await supabase
                .from('students')
                .insert([data]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            setDialogOpen(false);
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }) => {
            const { error } = await supabase
                .from('students')
                .update(data)
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            setDialogOpen(false);
            setEditingStudent(null);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase
                .from('students')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            setDeleteId(null);
        },
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
        return matchSearch && matchCycle;
    });

    const getClassName = (classId) => classes.find(c => c.id === classId)?.name || '—';

    return (
        <div className="space-y-6">
            <PageHeader title="Élèves" subtitle={`${students.length} élèves inscrits`}>
                <Button onClick={() => { setEditingStudent(null); setDialogOpen(true); }}>
                    <Plus className="w-4 h-4 mr-2" />Nouvel élève
                </Button>
            </PageHeader>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Rechercher un élève..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={cycleFilter} onValueChange={setCycleFilter}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les cycles</SelectItem>
                        <SelectItem value="Maternelle">Maternelle</SelectItem>
                        <SelectItem value="Primaire">Primaire</SelectItem>
                        <SelectItem value="Collège">Collège</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
                <EmptyState icon={Users} title="Aucun élève" description="Ajoutez votre premier élève pour commencer." />
            ) : (
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-muted/50 border-b border-border">
                                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Nom complet</th>
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
                                        <td className="py-3 px-4 font-medium">{s.first_name} {s.last_name}</td>
                                        <td className="py-3 px-4 hidden md:table-cell"><CycleBadge cycle={s.cycle} /></td>
                                        <td className="py-3 px-4 text-muted-foreground">{s.level}</td>
                                        <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">{getClassName(s.class_id)}</td>
                                        <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">{s.parent_name || '—'}</td>
                                        <td className="py-3 px-4">
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.status === 'Actif' ? 'bg-emerald-100 text-emerald-700' :
                                                    s.status === 'Transféré' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-red-100 text-red-700'
                                                }`}>{s.status}</span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button size="icon" variant="ghost" onClick={() => { setEditingStudent(s); setDialogOpen(true); }}>
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => setDeleteId(s.id)}>
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
                        <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground">Supprimer</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}