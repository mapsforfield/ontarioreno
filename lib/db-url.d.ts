// Type declarations for db-url.js (plain ESM, mirroring the
// schema-ddl.generated.js + .d.ts pattern already used in this directory).

export declare const PREVIEW_PREFIX: string;

export declare class PreviewDatabaseConfigError extends Error {
  constructor(message: string);
}

export declare function isPreviewEnv(env?: NodeJS.ProcessEnv): boolean;

/**
 * Database URL for the current environment.
 * Preview resolves only from PREVIEW_DATABASE_* and throws rather than falling
 * back to production. Production/local keep the existing unprefixed precedence.
 */
export declare function resolveDatabaseUrl(env?: NodeJS.ProcessEnv): string;

/**
 * Same resolution, but also reports which variable supplied the URL. Callers
 * that must prove they are not pointed at production assert on `key`.
 */
export declare function resolveDatabaseSource(env?: NodeJS.ProcessEnv): {
  key: string;
  url: string;
};

export declare function describeDatabaseSource(env?: NodeJS.ProcessEnv): string;
