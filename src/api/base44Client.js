import { supabase } from '@/lib/supabaseClient';

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

/**
 * Forms across the app send '' for an unset optional value. Postgres accepts
 * that on a text column but rejects it on every other type -- 22P02 for uuid
 * and integer, 22007 for timestamptz -- so an "Add Business" with no account
 * manager, or an "Add Task" with no due date, fails at the database. Normalising
 * here means every entity write is covered instead of each form individually.
 *
 * Only top-level values are touched: nested objects and arrays are jsonb
 * payloads (discussions.replies, tasks.subtasks) where '' is a legitimate value.
 *
 * @template {Record<string, any>} T
 * @param {T} record
 * @returns {T}
 */
function nullifyEmptyStrings(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return record;
  return /** @type {T} */ (
    Object.fromEntries(
      Object.entries(record).map(([key, value]) => [key, value === '' ? null : value])
    )
  );
}

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
        .insert(nullifyEmptyStrings(record))
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(id, updates) {
      const { data, error } = await supabase
        .from(tableName)
        .update(nullifyEmptyStrings(updates))
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
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
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

const authAdapter = {
  async me() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error('Not authenticated');
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    return { id: user.id, email: user.email, full_name: profile?.full_name || '', ...profile };
  },

  async login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async register({ email, password, full_name }) {
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { full_name } },
    });
    if (error) throw error;
    return data;
  },

  async logout(redirectTo) {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    if (redirectTo) window.location.href = redirectTo;
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

const integrationsAdapter = {
  Core: {
    /**
     * @param {{ prompt: string, response_json_schema?: any, model?: string, temperature?: number }} params
     */
    async InvokeLLM({ prompt, response_json_schema, model, temperature }) {
      const { data, error } = await supabase.functions.invoke('invoke-llm', {
        body: { prompt, response_json_schema, model, temperature },
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

const functionsAdapter = {
  async invoke(functionName, payload) {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload,
    });
    if (error) {
      let detailedMessage = error.message;
      const response = error.context;

      if (response && typeof response.json === 'function') {
        try {
          const errorBody = await response.json();
          if (errorBody?.error) {
            detailedMessage = String(errorBody.error);
          }
        } catch {
          // Ignore parse failures and fall back to the original message.
        }
      }

      throw new Error(detailedMessage || `Failed to invoke function: ${functionName}`);
    }
    return { data };
  },
};

const entities = {};
Object.entries(TABLE_MAP).forEach(([entityName, tableName]) => {
  entities[entityName] = createEntityAdapter(tableName);
});

export const base44 = {
  auth: authAdapter,
  entities,
  integrations: integrationsAdapter,
  functions: functionsAdapter,
};