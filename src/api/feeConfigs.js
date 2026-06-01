import { supabase } from './supabaseClient'

export const fetchFeeConfigs = async () => {
    const { data, error } = await supabase
        .from('fee_configs')
        .select('*')
        .order('cycle', { ascending: true });
    if (error) throw error;
    return data || [];
}

export const createFeeConfig = async (config) => {
    const { error } = await supabase.from('fee_configs').insert([config]);
    if (error) throw error;
}

export const updateFeeConfig = async (id, config) => {
    const { error } = await supabase.from('fee_configs').update(config).eq('id', id);
    if (error) throw error;
}

export const deleteFeeConfig = async (id) => {
    const { error } = await supabase.from('fee_configs').delete().eq('id', id);
    if (error) throw error;
}


// Récupère les frais applicables à un élève
export const getStudentFees = async (studentId) => {
    const { data: student } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

    if (!student) return [];

    // Priorité : classe > niveau > cycle
    const { data: fees } = await supabase
        .from('fee_configs')
        .select('*')
        .eq('school_year', student.school_year || '2025-2026')
        .or(`class_id.eq.${student.class_id},level.eq.${student.level},cycle.eq.${student.cycle}`);

    return fees || [];
}