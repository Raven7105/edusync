import { supabase } from './supabaseClient'

export const fetchAbsences = async () => {
    const { data, error } = await supabase
        .from('absences')
        .select('*')
        .order('date', { ascending: false });
    if (error) throw error;
    return data || [];
}

export const createAbsence = async (absence) => {
    const { error } = await supabase.from('absences').insert([absence]);
    if (error) throw error;
}

export const updateAbsence = async (id, absence) => {
    const { error } = await supabase.from('absences').update(absence).eq('id', id);
    if (error) throw error;
}

export const deleteAbsence = async (id) => {
    const { error } = await supabase.from('absences').delete().eq('id', id);
    if (error) throw error;
}