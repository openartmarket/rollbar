import ErrorStackParser from 'error-stack-parser';
import {
  Trace,
  StackFrame,
  Payload,
  Data,
  Request as RollbarRequest,
  Json,
  Body,
  SeverityLevel,
} from './types';

const defaultUrl = `https://api.rollbar.com/api/1/item/`;

export type RollbarData = Omit<Data, 'request' | 'body'>;
export type RollbarOptions = {
  data: RollbarData;
  request?: Request;
  accessToken?: string;
  customFetch?: typeof fetch;
  url?: string;
};

export type LogMessage = Error | string;

export class Rollbar {
  private readonly request?: Request;
  private rollbarRequest?: RollbarRequest;
  private readonly promises = new Set<Promise<void>>();

  constructor(private readonly options: RollbarOptions) {
    if (options.request) {
      this.request = options.request.clone();
    }
  }

  public async debug(logMessage: LogMessage) {
    return this.log(logMessage, 'debug');
  }
  public async critical(logMessage: LogMessage) {
    return this.log(logMessage, 'critical');
  }
  public async error(logMessage: LogMessage) {
    return this.log(logMessage, 'error');
  }
  public async info(logMessage: LogMessage) {
    return this.log(logMessage, 'info');
  }
  public async warning(logMessage: LogMessage) {
    return this.log(logMessage, 'warning');
  }

  public log(logMessage: LogMessage, level: SeverityLevel = 'debug'): Promise<void> {
    const promise = new Promise<void>((resolve, reject) => {
      this.postItem(logMessage, level)
        .then((res) => {
          if (!res.ok) {
            res.text().then((text) => {
              reject(new Error(`Failed to log to Rollbar: ${text}`));
            });
          } else {
            this.promises.delete(promise);
            resolve();
          }
        })
        .catch(reject);
    });
    this.promises.add(promise);
    return promise;
  }

  private async postItem(
    logMessage: LogMessage,
    level: SeverityLevel = 'debug',
  ): Promise<Response> {
    const { accessToken, customFetch = fetch, url = defaultUrl } = this.options;
    const payload = await this.toPayload(logMessage);
    // Set the timestamp here rather than in toPayload - to avoid flaky tests
    payload.data.timestamp = Math.round(Date.now() / 1000);
    payload.data.level = level;

    return customFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(accessToken ? { 'X-Rollbar-Access-Token': accessToken } : {}),
      },
      body: JSON.stringify(payload),
    });
  }

  async wait(): Promise<void> {
    const promises = [...this.promises];
    await Promise.all(promises);
  }

  public async toPayload(logMessage: LogMessage): Promise<Payload> {
    const { data } = this.options;
    const rollbarRequest = await this.getRollbarRequest();
    let body: Body;
    if (typeof logMessage === 'string') {
      body = {
        message: {
          body: logMessage,
        },
      };
    } else if (logMessage instanceof Error) {
      body = {
        trace: toRollbarTrace(logMessage),
      };
    } else {
      throw new Error('must be string or Error');
    }
    return {
      data: {
        ...data,
        body,
        request: rollbarRequest,
        language: 'javascript',
      },
    };
  }

  private async getRollbarRequest(): Promise<RollbarRequest | undefined> {
    if (this.rollbarRequest) {
      return this.rollbarRequest;
    } else {
      this.rollbarRequest = this.request ? await toRollbarRequest(this.request) : undefined;
    }
    return this.rollbarRequest;
  }
}

function toRollbarTrace(error: Error): Trace {
  const stack = ErrorStackParser.parse(error);
  return {
    frames: stack.map((stackFrame) => toRollbarStackFrame(stackFrame)),
    exception: {
      class: error.name,
      message: error.message,
    },
  };
}

async function toRollbarRequest(request: Request): Promise<RollbarRequest> {
  const { text, object } = await getRequestBody(request);
  const url = new URL(request.url);
  const result: RollbarRequest = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: text,
    POST: object,
    query_string: url.search,
    GET: Object.fromEntries(url.searchParams.entries()),
    user_ip: request.headers.get('x-forwarded-for') || undefined,
    params: {},
  };
  return result;
}

function toRollbarStackFrame(stackFrame: ErrorStackParser.StackFrame): StackFrame {
  return {
    filename: stackFrame.fileName || 'unknown_file_name',
    lineno: stackFrame.lineNumber,
    colno: stackFrame.columnNumber,
    method: stackFrame.functionName,
  };
}

type RequestBody =
  | {
      text: string;
      object?: undefined;
    }
  | {
      text?: undefined;
      object: Json;
    };

async function getRequestBody(request: Request): Promise<RequestBody> {
  const contentType = getContentType(request);
  if (contentType === 'application/json') {
    return {
      object: await request.json(),
    };
  } else if (contentType === 'application/x-www-form-urlencoded') {
    return {
      object: await getFormObject(request),
    };
  } else if (contentType === 'multipart/form-data') {
    return {
      object: await getFormObject(request),
    };
  } else {
    return {
      text: await request.text(),
    };
  }
}

async function getFormObject(request: Request): Promise<Json> {
  const body = await request.formData();
  const entries = [...body.entries()];
  return Object.fromEntries(entries.filter(([, value]) => typeof value === 'string')) as Json;
}

function getContentType(request: Request): string | null {
  const contentTypeHeader = request.headers.get('content-type');
  if (!contentTypeHeader) {
    return null;
  }
  const index = contentTypeHeader.indexOf(';');
  return index !== -1 ? contentTypeHeader.slice(0, index).trim() : contentTypeHeader.trim();
}
