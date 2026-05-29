import { supabase } from './supabaseClient'

export const fetchStudents = async () => {
    const { data, error } = await supabase
        .from('students').select('*')
        .order('last_name', { ascending: true });
    if (error) throw error;
    return data || [];
}

export const createStudent = async (student) => {
    const { error } = await supabase.from('students').insert([student]);
    if (error) throw error;
}

export const updateStudent = async (id, student) => {
    const { error } = await supabase.from('students').update(student).eq('id', id);
    if (error) throw error;
}

export const deleteStudent = async (id) => {
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) throw error;
}