// https://docs.rollbar.com/reference/create-item

export type Payload = {
  data: Data;
};

export type Data = {
  /** The name of the environment. */
  environment: string;
  /** Payload body data. */
  body: TraceBody | TraceChainBody | MessageBody;
  /** The severity level. */
  level?: SeverityLevel;
  /** When this occurred, as a unix timestamp. */
  timestamp?: number;
  /** A string describing the version of the application code. */
  code_version?: string;
  /** The platform on which this occurred. */
  platform?: string;
  /** The name of the language your code is written in. */
  language?: 'ruby' | 'javascript' | 'php' | 'java' | 'objective-c' | 'lua';
  /** The name of the framework your code uses. */
  framework?: string;
  // Optional: context
  // An identifier for which part of your application this event came from.
  // Items can be searched by context (prefix search)
  // For example, in a Rails app, this could be `controller#action`.
  // In a single-page javascript app, it could be the name of the current screen or route.
  context?: string;
  /** Data about the request this event occurred in. */
  request?: Request;
  person?: Person;
  server?: Server;
  client?: Client;
  custom?: JsonObject;
  fingerprint?: string;
  title?: string;
  uuid?: string;
  notifier?: Notifier;
};

type BodyBase = {
  /** Telemetry data array. */
  telemetry?: Telemetry[];
};

export type TraceBody = BodyBase & {
  /** Single trace data. */
  trace: Trace;
};

export type TraceChainBody = BodyBase & {
  /** Array of traces for exceptions with inner exceptions. */
  trace_chain?: Trace[];
};

export type MessageBody = BodyBase & {
  /** Message data. */
  message: Message;
};

export type Trace = {
  /** A list of stack frames, ordered such that the most recent call is last in the list. */
  frames: StackFrame[];
  /** An object describing the exception instance. */
  exception: Exception;
};

export type Telemetry = {
  /** The severity level of the telemetry data. */
  level: 'critical' | 'error' | 'warning' | 'info' | 'debug';
  /** The type of telemetry data. */
  type: 'log' | 'network' | 'dom' | 'navigation' | 'error' | 'manual';
  /** The source of the telemetry data. */
  source: 'client' | 'server';
  /** When this occurred, as a unix timestamp in milliseconds. */
  timestamp_ms: number;
  /** The subtype of the telemetry data. */
  body: {
    subtype?: string;
    /** The method used in the telemetry data. */
    method?: string;
    /** The URL in the telemetry data. */
    url?: string;
    /** The status code in the telemetry data. */
    status_code?: string;
    /** The start timestamp of the telemetry data. */
    start_timestamp_ms?: number;
    /** The end timestamp of the telemetry data. */
    end_timestamp_ms?: number;
  };
};

/**
 * Stack Frame type
 */
export type StackFrame = {
  /** The filename including its full path. */
  filename: string;
  /** The line number as an integer. */
  lineno?: number;
  /** The column number as an integer. */
  colno?: number;
  /** The method or function name. */
  method?: string;
  /** The line of code. */
  code?: string;
  /** A string containing the class name. */
  class_name?: string;
  context?: {
    /** List of lines of code before the "code" line. */
    pre?: string[];
    /** List of lines of code after the "code" line. */
    post?: string[];
  };
  /** List of the names of the arguments to the method/function call. */
  argspec?: string[];
  /** The name of the argument that is the list containing those arguments. */
  varargspec?: string;
  /** The name of the argument that is the object containing those arguments. */
  keywordspec?: string;
  /** Object of local variables for the method/function call. */
  locals?: Record<string, unknown>;
};

export type Exception = {
  /** The exception class name. */
  class: string;
  /** The exception message, as a string. */
  message?: string;
  /** An alternate human-readable string describing the exception. */
  description?: string;
};

export type Message = {
  /** The primary message text, as a string. */
  body: string;
  /** Arbitrary metadata keys and values. */
  [key: string]: Json;
};

type SeverityLevel = 'critical' | 'error' | 'warning' | 'info' | 'debug';

export type Request = {
  /** Full URL where this event occurred. */
  url: string;
  /** The request method. */
  method: string;
  /** Object containing the request headers. */
  headers: Record<string, string>;
  /** Any routing parameters. */
  params?: Record<string, string>;
  /** Query string params. */
  GET?: Json;
  /** The raw query string. */
  query_string?: string;
  /** POST params. */
  POST?: Json;
  /** The raw POST body. */
  body?: string;
  /** The user's IP address as a string. */
  user_ip?: string;
};

/**
 * Person type
 */
type Person = {
  /** A string identifying this user in your system. */
  id: string;
  /** A string representing the username. */
  username?: string;
  /** A string representing the email. */
  email?: string;
};

/**
 * Server Data type
 */
type Server = {
  /** A string representing the CPU. */
  cpu?: string;
  /** The server hostname. */
  host?: string;
  /** Path to the application code root. */
  root?: string;
  /** Name of the checked-out source control branch. */
  branch?: string;
  /** String describing the running code version on the server. */
  code_version?: string;
  /** Git SHA of the running code revision. Deprecated. */
  sha?: string;
};

type Client = {
  /** A string representing the CPU. */
  cpu?: string;
  javascript?: {
    /** The user agent string. */
    browser?: string;
    /** String describing the running code version in javascript. */
    code_version?: string;
    /** Set to true to enable source map deobfuscation. */
    source_map_enabled?: boolean;
    /** Set to true to enable frame guessing. */
    guess_uncaught_frames?: boolean;
  };
};

type Notifier = {
  /** Name of the library. */
  name?: string;
  /** Library version string. */
  version?: string;
};

type JsonObject = {
  [key: string]: Json;
};

export type Json = string | number | boolean | null | Json[] | JsonObject;
