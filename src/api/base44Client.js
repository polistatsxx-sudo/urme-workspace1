import { supabase } from '@/lib/supabaseClient';

// Table name mapping (entity name → Supabase table)
const TABLE_MAP = {
  Business: 'businesses',
  Contact: 'contacts',
  Interaction: 'interactions',
  Match: 'matches',
  Event: 'events',
  Task: 'tasks',
  Idea: 'ideas',
  Discussion: 'discussions',
  FinanceEntry: 'finance_entries',
  EmailTemplate: 'email_templates',
  AppSettings: 'app_settings',
  User: 'profiles',
};

// Create entity adapter that mimics Base44's API
function createEntityAdapter(tableName) {
  return {
    async list(orderBy) {
      let query = supabase.from(tableName).select('*');
      if (orderBy) {
        const desc = orderBy.startsWith('-');
        const col = desc ? orderBy.slice(1) : orderBy;
        query = query.order(col, { ascending: !desc });
      } else {
        query = query.order('created_date', { ascending: false });
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async create(record) {
      const { data, error } = await supabase
        .from(tableName)
        .insert(record)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(id, updates) {
      const { data, error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    },

    async filter(filters, orderBy) {
      let query = supabase.from(tableName).select('*');
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      // Apply ordering
      if (orderBy) {
        const desc = orderBy.startsWith('-');
        const col = desc ? orderBy.slice(1) : orderBy;
        query = query.order(col, { ascending: !desc });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  };
}

// Auth adapter
const authAdapter = {
  async me() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error('Not authenticated');
    
    // Get profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    return {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name || '',
      ...profile,
    };
  },

  async login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async register({ email, password, full_name }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name } },
    });
    if (error) throw error;
    return data;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async forgotPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },

  async resetPassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// Integrations adapter (LLM, file upload)
const integrationsAdapter = {
  Core: {
    async InvokeLLM({ prompt, response_json_schema }) {
      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('invoke-llm', {
        body: { prompt, response_json_schema },
      });
      if (error) throw error;
      return data;
    },

    async UploadFile({ file }) {
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(fileName, file);
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(fileName);
      
      return { file_url: urlData.publicUrl };
    },
  },
};

// Functions adapter
const functionsAdapter = {
  async invoke(functionName, payload) {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload,
    });
    if (error) throw error;
    return { data };
  },
};

// Build entities proxy
const entities = {};
Object.entries(TABLE_MAP).forEach(([entityName, tableName]) => {
  entities[entityName] = createEntityAdapter(tableName);
});

// Export the adapter with same shape as base44 client
export const base44 = {
  auth: authAdapter,
  entities,
  integrations: integrationsAdapter,
  functions: functionsAdapter,
};
