import { supabase } from './supabaseClient'

export const fetchPayments = async () => {
    const { data, error } = await supabase
        .from('payments').select('*')
        .order('payment_date', { ascending: false });
    if (error) throw error;
    return data || [];
}

export const createPayment = async (payment) => {
    const { error } = await supabase.from('payments').insert([payment]);
    if (error) throw error;
}

export const updatePayment = async (id, payment) => {
    const { error } = await supabase.from('payments').update(payment).eq('id', id);
    if (error) throw error;
}

export const deletePayment = async (id) => {
    const { error } = await supabase.from('payments').delete().eq('id', id);
    if (error) throw error;
}