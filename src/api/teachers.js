import { supabase } from './supabaseClient'

export const fetchTeachers = async () => {
    const { data, error } = await supabase
        .from('teachers').select('*')
        .order('last_name', { ascending: true });
    if (error) throw error;
    return data || [];
}

export const createTeacher = async (teacher) => {
    const { error } = await supabase.from('teachers').insert([teacher]);
    if (error) throw error;
}

export const updateTeacher = async (id, teacher) => {
    const { error } = await supabase.from('teachers').update(teacher).eq('id', id);
    if (error) throw error;
}

export const deleteTeacher = async (id) => {
    const { error } = await supabase.from('teachers').delete().eq('id', id);
    if (error) throw error;
}