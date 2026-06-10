/**
 * The Twitter API47 upstream returns loosely-typed JSON payloads that vary
 * per endpoint. Consumers should treat the response as a plain object and
 * narrow it as needed.
 */
export type TwitterApiResponse = Record<string, any>;
