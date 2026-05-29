import { supabase } from './supabaseClient'

export const fetchClasses = async () => {
    const { data, error } = await supabase
        .from('school_classes').select('*')
        .order('cycle', { ascending: true });
    if (error) throw error;
    return data || [];
}

export const createClass = async (schoolClass) => {
    const { error } = await supabase.from('school_classes').insert([schoolClass]);
    if (error) throw error;
}

export const updateClass = async (id, schoolClass) => {
    const { error } = await supabase.from('school_classes').update(schoolClass).eq('id', id);
    if (error) throw error;
}

export const deleteClass = async (id) => {
    const { error } = await supabase.from('school_classes').delete().eq('id', id);
    if (error) throw error;
}