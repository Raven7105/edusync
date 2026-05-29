import { supabase } from './supabaseClient'

export const fetchMessages = async (userId) => {
    const { data, error } = await supabase
        .from('messages').select('*')
        .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
}

export const createMessage = async (message) => {
    const { error } = await supabase.from('messages').insert([message]);
    if (error) throw error;
}

export const markAsRead = async (id) => {
    const { error } = await supabase.from('messages').update({ read: true }).eq('id', id);
    if (error) throw error;
}

export const deleteMessage = async (id) => {
    const { error } = await supabase.from('messages').delete().eq('id', id);
    if (error) throw error;
}