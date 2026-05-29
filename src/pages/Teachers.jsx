import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Pencil, Trash2, GraduationCap, Upload } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import toast from 'react-hot-toast';
import { fetchTeachers, createTeacher, updateTeacher, deleteTeacher } from '@/api/teachers';
import { supabase } from '@/api/supabaseClient';

const SUBJECTS = [
    'Français', 'Mathématiques', 'Sciences', 'Histoire-Géo', 'Anglais',
    'EPS', 'Arts', 'Musique', 'Technologie', 'SVT', 'Physique-Chimie'
];
const CYCLES = ['Maternelle', 'Primaire', 'Collège'];

const DEFAULT_FORM = {
    first_name: '', last_name: '', phone: '', email: '',
    subjects: [], cycles: [], status: 'Actif',
    hire_date: new Date().toISOString().split('T')[0],
    photo_url: '',
};

function TeacherForm({ teacher, open, onOpenChange, onSave }) {
    const [form, setForm] = useState(DEFAULT_FORM);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setForm(teacher ? { ...DEFAULT_FORM, ...teacher } : DEFAULT_FORM);
        }
    }, [teacher, open]);

    const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    const toggleItem = (arr, item) =>
        arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
            const filePath = `teacher-photos/${fileName}`;
            const { error: uploadError } = await supabase.storage
                .from('documents').upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data: publicUrlData } = supabase.storage
                .from('documents').getPublicUrl(filePath);
            set('photo_url', publicUrlData.publicUrl);
            toast.success('Photo uploadée');
        } catch {
            toast.error("Erreur lors de l'upload");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const cleaned = {
                ...form,
                photo_url: form.photo_url || null,
                hire_date: form.hire_date || null,
            };
            await onSave(cleaned);
        } finally {
            setSaving(false);
        }
    };

    const isValid = form.first_name.trim() && form.last_name.trim();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{teacher ? "Modifier l'enseignant" : "Nouvel enseignant"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Photo */}
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-muted border-2 border-border overflow-hidden flex items-center justify-center flex-shrink-0">
                            {form.photo_url
                                ? <img src={form.photo_url} alt="photo" className="w-full h-full object-cover" />
                                : <span className="text-2xl font-bold text-muted-foreground">
                                    {form.first_name?.charAt(0)?.toUpperCase() || '?'}
                                </span>
                            }
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="cursor-pointer">
                                <span className="inline-flex items-center gap-2 text-sm text-primary border border-primary/30 bg-primary/5 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors">
                                    <Upload className="w-3.5 h-3.5" />
                                    {uploading ? 'Envoi...' : 'Choisir une photo'}
                                </span>
                                <input type="file" accept="image/*" className="hidden"
                                    onChange={handlePhotoUpload} disabled={uploading} />
                            </label>
                            {form.photo_url && (
                                <button type="button" onClick={() => set('photo_url', '')}
                                    className="text-xs text-destructive hover:underline">
                                    Supprimer
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Infos personnelles */}
                    <div>
                        <p className="text-sm font-semibold text-foreground mb-3">Informations personnelles</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Prénom *</Label>
                                <Input value={form.first_name}
                                    onChange={e => set('first_name', e.target.value)}
                                    required placeholder="Ex: Jean" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Nom *</Label>
                                <Input value={form.last_name}
                                    onChange={e => set('last_name', e.target.value)}
                                    required placeholder="Ex: Dupont" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Téléphone</Label>
                                <Input value={form.phone}
                                    onChange={e => set('phone', e.target.value)}
                                    placeholder="+228 90 00 00 00" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Email</Label>
                                <Input type="email" value={form.email}
                                    onChange={e => set('email', e.target.value)}
                                    placeholder="prof@email.com" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Date d'embauche</Label>
                                <Input type="date" value={form.hire_date}
                                    onChange={e => set('hire_date', e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Statut</Label>
                                <Select value={form.status} onValueChange={v => set('status', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Actif">Actif</SelectItem>
                                        <SelectItem value="Inactif">Inactif</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Cycles */}
                    <div className="border-t border-border pt-4">
                        <p className="text-sm font-semibold text-foreground mb-3">Cycles enseignés</p>
                        <div className="flex gap-4 flex-wrap">
                            {CYCLES.map(c => (
                                <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
                                    <Checkbox
                                        checked={form.cycles?.includes(c)}
                                        onCheckedChange={() => set('cycles', toggleItem(form.cycles || [], c))}
                                    />
                                    {c}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Matières */}
                    <div className="border-t border-border pt-4">
                        <p className="text-sm font-semibold text-foreground mb-3">Matières enseignées</p>
                        <div className="flex gap-2 flex-wrap">
                            {SUBJECTS.map(s => (
                                <Badge
                                    key={s}
                                    variant={form.subjects?.includes(s) ? 'default' : 'outline'}
                                    className="cursor-pointer select-none"
                                    onClick={() => set('subjects', toggleItem(form.subjects || [], s))}
                                >
                                    {s}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Boutons */}
                    <div className="flex justify-end gap-3 pt-2 border-t border-border">
                        <Button type="button" variant="outline"
                            onClick={() => onOpenChange(false)} disabled={saving}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={!isValid || saving}>
                            {saving ? 'Enregistrement...' : teacher ? 'Enregistrer' : 'Ajouter'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function Teachers() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [search, setSearch] = useState('');
    const [cycleFilter, setCycleFilter] = useState('all');
    const queryClient = useQueryClient();

    const { data: teachers = [], isLoading } = useQuery({
        queryKey: ['teachers'],
        queryFn: fetchTeachers,
    });

    const createMut = useMutation({
        mutationFn: createTeacher,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teachers'] });
            setDialogOpen(false);
            toast.success('Enseignant ajouté');
        },
        onError: () => toast.error("Erreur lors de l'ajout"),
    });

    const updateMut = useMutation({
        mutationFn: ({ id, data }) => updateTeacher(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teachers'] });
            setDialogOpen(false);
            setEditing(null);
            toast.success('Enseignant mis à jour');
        },
        onError: () => toast.error('Erreur lors de la mise à jour'),
    });

    const deleteMut = useMutation({
        mutationFn: deleteTeacher,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teachers'] });
            setDeleteId(null);
            toast.success('Enseignant supprimé');
        },
        onError: () => toast.error('Erreur lors de la suppression'),
    });

    const handleSave = (data) => {
        if (editing) {
            updateMut.mutate({ id: editing.id, data });
        } else {
            createMut.mutate(data);
        }
    };

    const filtered = teachers.filter(t => {
        const matchSearch = `${t.first_name} ${t.last_name}`.toLowerCase().includes(search.toLowerCase());
        const matchCycle = cycleFilter === 'all' || t.cycles?.includes(cycleFilter);
        return matchSearch && matchCycle;
    });

    const activeCount = teachers.filter(t => t.status === 'Actif').length;

    return (
        <div className="space-y-6">
            <PageHeader title="Enseignants" subtitle={`${teachers.length} enseignants · ${activeCount} actifs`}>
                <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
                    <Plus className="w-4 h-4 mr-2" /> Nouvel enseignant
                </Button>
            </PageHeader>

            {/* Filtres */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Rechercher un enseignant..." value={search}
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
                <EmptyState icon={GraduationCap} title="Aucun enseignant trouvé"
                    description={search || cycleFilter !== 'all'
                        ? "Aucun résultat pour ces filtres."
                        : "Ajoutez votre premier enseignant."} />
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map(t => (
                            <div key={t.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-lg transition-all duration-200">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="w-12 h-12 rounded-full bg-muted border border-border overflow-hidden flex items-center justify-center flex-shrink-0">
                                        {t.photo_url
                                            ? <img src={t.photo_url} alt="" className="w-full h-full object-cover" />
                                            : <span className="text-sm font-bold text-muted-foreground">
                                                {t.first_name?.[0]}{t.last_name?.[0]}
                                            </span>
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="font-semibold text-foreground truncate">
                                                {t.first_name} {t.last_name}
                                            </h3>
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${t.status === 'Actif'
                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                                    : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                                                }`}>{t.status}</span>
                                        </div>
                                        {t.email && <p className="text-xs text-muted-foreground truncate">{t.email}</p>}
                                        {t.phone && <p className="text-xs text-muted-foreground">{t.phone}</p>}
                                    </div>
                                </div>

                                {t.cycles?.length > 0 && (
                                    <div className="flex gap-1.5 flex-wrap mb-2">
                                        {t.cycles.map(c => (
                                            <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                                        ))}
                                    </div>
                                )}

                                {t.subjects?.length > 0 && (
                                    <div className="flex gap-1 flex-wrap mb-3">
                                        {t.subjects.slice(0, 4).map(s => (
                                            <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                                        ))}
                                        {t.subjects.length > 4 && (
                                            <Badge variant="secondary" className="text-xs">+{t.subjects.length - 4}</Badge>
                                        )}
                                    </div>
                                )}

                                <div className="flex justify-end gap-1 border-t border-border pt-3 mt-3">
                                    <Button size="sm" variant="ghost"
                                        onClick={() => { setEditing(t); setDialogOpen(true); }}>
                                        <Pencil className="w-3.5 h-3.5 mr-1" /> Modifier
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setDeleteId(t.id)}>
                                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {filtered.length} enseignant{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
                        {filtered.length !== teachers.length && ` sur ${teachers.length}`}
                    </p>
                </>
            )}

            <TeacherForm teacher={editing} open={dialogOpen} onOpenChange={setDialogOpen} onSave={handleSave} />

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cet enseignant ?</AlertDialogTitle>
                        <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
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