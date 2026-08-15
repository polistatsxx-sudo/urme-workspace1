// Minimal stand-in for @supabase/supabase-js, enough to drive the account-management
// Edge Functions end to end without a database.

export const state: {
  caller: { id: string } | null;
  profiles: Array<Record<string, unknown>>;
  updated: Record<string, unknown> | null;
  deletedProfileIds: string[];
  deletedAuthIds: string[];
} = {
  caller: null,
  profiles: [],
  updated: null,
  deletedProfileIds: [],
  deletedAuthIds: [],
};

export function resetState(profiles: Array<Record<string, unknown>>, caller: { id: string } | null) {
  state.caller = caller;
  state.profiles = profiles;
  state.updated = null;
  state.deletedProfileIds = [];
  state.deletedAuthIds = [];
}

type Result = { data: unknown; error: unknown };

class Query implements PromiseLike<Result> {
  private op = 'select';
  private payload: Record<string, unknown> = {};
  private id = '';
  private wantsSingle = false;

  select(_columns?: string) {
    return this;
  }

  update(payload: Record<string, unknown>) {
    this.op = 'update';
    this.payload = payload;
    return this;
  }

  upsert(payload: Record<string, unknown>) {
    this.op = 'upsert';
    this.payload = payload;
    return this;
  }

  delete() {
    this.op = 'delete';
    return this;
  }

  eq(_column: string, value: string) {
    this.id = value;
    return this;
  }

  single() {
    this.wantsSingle = true;
    return this;
  }

  private run(): Result {
    if (this.op === 'update') {
      const row = state.profiles.find((p) => p.id === this.id);
      state.updated = { ...(row ?? {}), ...this.payload };
      return { data: state.updated, error: null };
    }
    if (this.op === 'upsert') {
      state.profiles.push(this.payload);
      return { data: this.payload, error: null };
    }
    if (this.op === 'delete') {
      state.deletedProfileIds.push(this.id);
      state.profiles = state.profiles.filter((p) => p.id !== this.id);
      return { data: null, error: null };
    }
    if (this.id) {
      const row = state.profiles.find((p) => p.id === this.id) ?? null;
      return { data: this.wantsSingle ? row : row ? [row] : [], error: null };
    }
    return { data: state.profiles, error: null };
  }

  then<TResult1 = Result, TResult2 = never>(
    onfulfilled?: ((value: Result) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.run()).then(onfulfilled, onrejected);
  }
}

export function createClient(_url: string, key: string, _options?: unknown) {
  const isServiceRole = key === 'service-role-key';
  return {
    auth: {
      getUser: () =>
        Promise.resolve(
          state.caller
            ? { data: { user: state.caller }, error: null }
            : { data: { user: null }, error: { message: 'no session' } },
        ),
      admin: {
        createUser: ({ email }: { email: string }) =>
          Promise.resolve({ data: { user: { id: `new-${email}` } }, error: null }),
        deleteUser: (id: string) => {
          state.deletedAuthIds.push(id);
          return Promise.resolve({ data: null, error: null });
        },
      },
    },
    from: (_table: string) => {
      if (!isServiceRole) throw new Error('caller client must not read profiles directly');
      return new Query();
    },
  };
}
