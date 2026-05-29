import { supabase } from './supabaseClient'

export const fetchSchedules = async () => {
    const { data, error } = await supabase
        .from('schedules').select('*')
        .order('week_start', { ascending: false });
    if (error) throw error;
    return data || [];
}

export const createSchedule = async (schedule) => {
    const { error } = await supabase.from('schedules').insert([schedule]);
    if (error) throw error;
}

export const updateSchedule = async (id, schedule) => {
    const { error } = await supabase.from('schedules').update(schedule).eq('id', id);
    if (error) throw error;
}

export const deleteSchedule = async (id) => {
    const { error } = await supabase.from('schedules').delete().eq('id', id);
    if (error) throw error;
}