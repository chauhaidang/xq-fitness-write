/**
 * Type declarations for @chauhaidang/xq-js-common-kit
 */

declare module '@chauhaidang/xq-js-common-kit' {
  export interface logger {
    setLevel(level: string | number): void;
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
  }

  export const logger: logger;

  export const LOG_LEVELS: {
    DEBUG: number;
    INFO: number;
    WARN: number;
    ERROR: number;
  };

  export function generateRandomString(length?: number): string;
  export function getConfig(key: string): any;
  export function readYAML(filePath: string): any;
  export function generateMarkdownFromJunit(junitXmlPath: string): string;
}
