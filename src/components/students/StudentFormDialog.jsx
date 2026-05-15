import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/api/supabaseClient';
import { Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';

const LEVELS_BY_CYCLE = {
    Maternelle: ['Petite Section', 'Moyenne Section', 'Grande Section'],
    Primaire: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
    Collège: ['6ème', '5ème', '4ème', '3ème'],
};

export default function StudentFormDialog({ open, onOpenChange, student, classes, onSave }) {
    const [form, setForm] = useState({
        first_name: '', last_name: '', date_of_birth: '', gender: 'M',
        cycle: 'Primaire', level: 'CP', class_id: '', parent_name: '',
        parent_phone: '', parent_email: '', address: '', status: 'Actif',
        enrollment_date: new Date().toISOString().split('T')[0], photo_url: '',
    });
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (student) {
            setForm({ ...form, ...student });
        } else {
            setForm({
                first_name: '', last_name: '', date_of_birth: '', gender: 'M',
                cycle: 'Primaire', level: 'CP', class_id: '', parent_name: '',
                parent_phone: '', parent_email: '', address: '', status: 'Actif',
                enrollment_date: new Date().toISOString().split('T')[0], photo_url: '',
            });
        }
    }, [student, open]);

    const handleCycleChange = (cycle) => {
        setForm({ ...form, cycle, level: LEVELS_BY_CYCLE[cycle][0] });
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            // Générer un nom unique pour la photo
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
            const filePath = `student-photos/${fileName}`;

            // Upload le fichier dans Supabase Storage
            const { error: uploadError, data } = await supabase.storage
                .from('documents') // Remplace 'documents' par le nom de ton bucket
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Récupère l'URL publique
            const { data: publicUrlData } = supabase.storage
                .from('documents')
                .getPublicUrl(filePath);

            setForm(f => ({ ...f, photo_url: publicUrlData.publicUrl }));
            toast.success('Photo uploadée');
        } catch (error) {
            console.error('Erreur upload:', error);
            toast.error('Erreur lors de l\'upload');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(form);
    };

    const filteredClasses = classes.filter(c => c.cycle === form.cycle && c.level === form.level);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{student ? "Modifier l'élève" : "Nouvel élève"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Photo */}
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-muted border-2 border-border overflow-hidden flex items-center justify-center">
                            {form.photo_url
                                ? <img src={form.photo_url} alt="photo" className="w-full h-full object-cover" />
                                : <span className="text-2xl font-bold text-muted-foreground">{form.first_name?.charAt(0) || '?'}</span>
                            }
                        </div>
                        <div>
                            <label className="cursor-pointer">
                                <span className="inline-flex items-center gap-2 text-sm text-primary border border-primary/30 bg-primary/5 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors">
                                    <Upload className="w-3.5 h-3.5" />
                                    {uploading ? 'Envoi...' : 'Photo'}
                                </span>
                                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                            </label>
                            {form.photo_url && (
                                <button type="button" onClick={() => setForm(f => ({ ...f, photo_url: '' }))} className="ml-2 text-xs text-destructive hover:underline">
                                    Supprimer
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label>Prénom *</Label>
                            <Input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} required />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Nom *</Label>
                            <Input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} required />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Date de naissance</Label>
                            <Input type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Sexe</Label>
                            <Select value={form.gender} onValueChange={v => setForm({ ...form, gender: v })}>
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
                            <Select value={form.level} onValueChange={v => setForm({ ...form, level: v })}>
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
                            <Select value={form.class_id} onValueChange={v => setForm({ ...form, class_id: v })}>
                                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                                <SelectContent>
                                    {filteredClasses.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Statut</Label>
                            <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Actif">Actif</SelectItem>
                                    <SelectItem value="Inactif">Inactif</SelectItem>
                                    <SelectItem value="Transféré">Transféré</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="border-t border-border pt-4">
                        <p className="text-sm font-medium text-muted-foreground mb-3">Informations parent/tuteur</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Nom du parent</Label>
                                <Input value={form.parent_name} onChange={e => setForm({ ...form, parent_name: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Téléphone</Label>
                                <Input value={form.parent_phone} onChange={e => setForm({ ...form, parent_phone: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Email</Label>
                                <Input type="email" value={form.parent_email} onChange={e => setForm({ ...form, parent_email: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Adresse</Label>
                                <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
                        <Button type="submit">{student ? 'Enregistrer' : 'Inscrire'}</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}