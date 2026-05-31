import { supabase } from './supabaseClient'

export const fetchPayments = async () => {
    const { data, error } = await supabase
        .from('payments').select(`
            *,
            students (
                id,
                first_name,
                last_name,
                status,
                class_id,
                level,
                cycle
            )
        `)
        .order('payment_date', { ascending: false });
    if (error) throw error;
    
    // Enrichir les paiements avec le nom de l'étudiant
    return (data || []).map(payment => ({
        ...payment,
        student_name: payment.students ? `${payment.students.first_name} ${payment.students.last_name}` : payment.student_name || 'Inconnu'
    }));
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