/**
 * Authentication and notification types
 */

export type Notice = { kind: "success" | "error" | "info"; text: string } | null;
