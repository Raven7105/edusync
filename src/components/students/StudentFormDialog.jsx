import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/api/supabaseClient';
import { Upload } from 'lucide-react';
import toast from 'react-hot-toast';

const LEVELS_BY_CYCLE = {
    Maternelle: ['Petite Section', 'Moyenne Section', 'Grande Section'],
    Primaire: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
    Collège: ['6ème', '5ème', '4ème', '3ème'],
};

const DEFAULT_FORM = {
    first_name: '', last_name: '', date_of_birth: '', gender: 'M',
    cycle: 'Primaire', level: 'CP', class_id: '', parent_name: '',
    parent_phone: '', parent_email: '', address: '', status: 'Actif',
    enrollment_date: new Date().toISOString().split('T')[0], photo_url: '',
};

export default function StudentFormDialog({ open, onOpenChange, student, classes, onSave }) {
    const [form, setForm] = useState(DEFAULT_FORM);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setForm(student ? { ...DEFAULT_FORM, ...student } : DEFAULT_FORM);
        }
    }, [student, open]);

    const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    const handleCycleChange = (cycle) => {
        setForm(prev => ({ ...prev, cycle, level: LEVELS_BY_CYCLE[cycle][0], class_id: '' }));
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
            const filePath = `student-photos/${fileName}`;
            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data: publicUrlData } = supabase.storage
                .from('documents')
                .getPublicUrl(filePath);
            set('photo_url', publicUrlData.publicUrl);
            toast.success('Photo uploadée');
        } catch (error) {
            toast.error("Erreur lors de l'upload");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave(form);
        } finally {
            setSaving(false);
        }
    };

    const filteredClasses = classes.filter(c => c.cycle === form.cycle && c.level === form.level);
    const isValid = form.first_name.trim() && form.last_name.trim();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{student ? "Modifier l'élève" : "Nouvel élève"}</DialogTitle>
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
                                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                            </label>
                            {form.photo_url && (
                                <button type="button" onClick={() => set('photo_url', '')}
                                    className="text-xs text-destructive hover:underline">
                                    Supprimer
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Infos élève */}
                    <div>
                        <p className="text-sm font-semibold text-foreground mb-3">Informations de l'élève</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Prénom *</Label>
                                <Input value={form.first_name} onChange={e => set('first_name', e.target.value)} required placeholder="Ex: Jean" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Nom *</Label>
                                <Input value={form.last_name} onChange={e => set('last_name', e.target.value)} required placeholder="Ex: Dupont" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Date de naissance</Label>
                                <Input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Sexe</Label>
                                <Select value={form.gender} onValueChange={v => set('gender', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="M">Masculin</SelectItem>
                                        <SelectItem value="F">Féminin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Cycle *</Label>
                                <Select value={form.cycle} onValueChange={handleCycleChange}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Maternelle">Maternelle</SelectItem>
                                        <SelectItem value="Primaire">Primaire</SelectItem>
                                        <SelectItem value="Collège">Collège</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Niveau *</Label>
                                <Select value={form.level} onValueChange={v => set('level', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {LEVELS_BY_CYCLE[form.cycle]?.map(l => (
                                            <SelectItem key={l} value={l}>{l}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Classe</Label>
                                <Select value={form.class_id} onValueChange={v => set('class_id', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={filteredClasses.length === 0 ? "Aucune classe disponible" : "Sélectionner"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredClasses.length === 0
                                            ? <SelectItem value="none" disabled>Aucune classe pour ce niveau</SelectItem>
                                            : filteredClasses.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))
                                        }
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Statut</Label>
                                <Select value={form.status} onValueChange={v => set('status', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Actif">Actif</SelectItem>
                                        <SelectItem value="Inactif">Inactif</SelectItem>
                                        <SelectItem value="Transféré">Transféré</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Date d'inscription</Label>
                                <Input type="date" value={form.enrollment_date} onChange={e => set('enrollment_date', e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {/* Infos parent */}
                    <div className="border-t border-border pt-4">
                        <p className="text-sm font-semibold text-foreground mb-3">Informations parent / tuteur</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Nom du parent</Label>
                                <Input value={form.parent_name} onChange={e => set('parent_name', e.target.value)} placeholder="Ex: Marie Dupont" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Téléphone</Label>
                                <Input value={form.parent_phone} onChange={e => set('parent_phone', e.target.value)} placeholder="+228 90 00 00 00" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Email</Label>
                                <Input type="email" value={form.parent_email} onChange={e => set('parent_email', e.target.value)} placeholder="parent@email.com" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Adresse</Label>
                                <Input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Ex: Lomé, Tokoin" />
                            </div>
                        </div>
                    </div>

                    {/* Boutons */}
                    <div className="flex justify-end gap-3 pt-2 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={!isValid || saving}>
                            {saving ? 'Enregistrement...' : student ? 'Enregistrer' : 'Inscrire'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}