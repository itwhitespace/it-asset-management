import { supabase } from "@/lib/supabase";

export type Admin = {
  id: string;
  name: string;
  email: string;
  pin: string;
};

export const getAdmins = async (): Promise<Admin[]> => {
  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error("Error fetching admins:", error);
    return [];
  }
  return data || [];
};

export const addAdmin = async (admin: Omit<Admin, 'id'>) => {
  const { data, error } = await supabase
    .from('admins')
    .insert([admin])
    .select();
  
  if (error) throw error;
  return data;
};

export const deleteAdmin = async (id: string) => {
  const { error } = await supabase
    .from('admins')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const validatePin = async (pin: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('admins')
    .select('id')
    .eq('pin', pin)
    .single();
  
  if (error || !data) return false;
  return true;
};
