import { type Env, envSchema } from '@/schemas/env.schema';

let _env: Env | undefined;

/** Lazily parse and cache validated environment variables. Deferred to avoid crashing at build time. */
function getEnv(): Env {
  if (!_env) {
    _env = envSchema.parse(process.env);
  }
  return _env;
}

export const env = new Proxy({} as Env, {
  get(_target, prop: string) {
    return getEnv()[prop as keyof Env];
  },
});
