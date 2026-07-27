export declare const PREVIEW_PREFIX: string;
export declare class PreviewDatabaseConfigError extends Error {
  constructor(message: string);
}
export declare function isPreviewEnv(env?: NodeJS.ProcessEnv): boolean;
export declare function isPostgresUrl(value: unknown): boolean;
export declare function resolveDatabaseSource(env?: NodeJS.ProcessEnv): { key: string; url: string };
export declare function resolveDatabaseUrl(env?: NodeJS.ProcessEnv): string;
export declare function describeDatabaseSource(env?: NodeJS.ProcessEnv): string;
