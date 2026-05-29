import { supabase } from './supabaseClient'

export const fetchGrades = async () => {
    const { data, error } = await supabase
        .from('grades').select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
}

export const createGrade = async (grade) => {
    const { error } = await supabase.from('grades').insert([grade]);
    if (error) throw error;
}

export const updateGrade = async (id, grade) => {
    const { error } = await supabase.from('grades').update(grade).eq('id', id);
    if (error) throw error;
}

export const deleteGrade = async (id) => {
    const { error } = await supabase.from('grades').delete().eq('id', id);
    if (error) throw error;
}