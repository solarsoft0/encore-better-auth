export * from "./encore-better-auth";
export * from "better-auth";
export type * from "zod";

//@ts-expect-error: we need to export helper types even when they conflict with better-call types to avoid "The inferred type of 'auth' cannot be named without a reference to..."
export type * from "./types/helper";
export type * from "./types/index";