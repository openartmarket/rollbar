import ErrorStackParser from 'error-stack-parser';
import { Trace, StackFrame, Payload, Data, Request as RollbarRequest, Json } from './types';

const rollbarUrl = `https://api.rollbar.com/api/1/item/`;

export type RollbarData = Pick<
  Data,
  'environment' | 'code_version' | 'platform' | 'framework' | 'language'
>;
export type RollbarOptions = {
  accessToken?: string;
  customFetch?: typeof fetch;
};

export type LogParams = {
  error: Error;
  request?: Request;
};

export class Rollbar {
  constructor(
    private readonly data: RollbarData,
    private readonly options: RollbarOptions,
  ) {}

  public async log(params: LogParams) {
    const payload = await this.toPayload(params);

    const { accessToken, customFetch = fetch } = this.options;
    const res = await customFetch(rollbarUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(accessToken ? { 'X-Rollbar-Access-Token': accessToken } : {}),
      },
      body: JSON.stringify(payload),
    });
    console.log(res.status);
  }

  public async toPayload({ error, request }: LogParams): Promise<Payload> {
    return {
      data: {
        ...this.data,
        body: {
          trace: toRollbarTrace(error),
        },
        request: request ? await toRollbarRequest(request) : undefined,
      },
    };
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
