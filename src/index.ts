import ErrorStackParser from 'error-stack-parser';
import { Trace, StackFrame, Payload, Data } from './types';

const rollbarUrl = `https://api.rollbar.com/api/1/item/`;

export type LogParams = {
  error: Error;
};

export type RollbarData = Pick<
  Data,
  'environment' | 'code_version' | 'platform' | 'framework' | 'language'
>;
export type RollbarOptions = {
  accessToken: string;
  customFetch?: typeof fetch;
};

export class Rollbar {
  constructor(
    private readonly data: RollbarData,
    private readonly options: RollbarOptions,
  ) {}

  public async log(params: LogParams) {
    const payload = this.toPayload(params);

    const { accessToken, customFetch = fetch } = this.options;
    await customFetch(rollbarUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Rollbar-Access-Token': accessToken,
      },
      body: JSON.stringify(payload),
    });
  }

  public toPayload({ error }: LogParams): Payload {
    return {
      data: {
        ...this.data,
        body: {
          trace: toTrace(error),
        },
      },
    };
  }
}

export function toTrace(error: Error): Trace {
  const stack = ErrorStackParser.parse(error);
  return {
    frames: stack.map((stackFrame) => toRollbarFrame(stackFrame)),
    exception: {
      class: error.name,
      message: error.message,
    },
  };
}

function toRollbarFrame(stackFrame: ErrorStackParser.StackFrame): StackFrame {
  return {
    filename: stackFrame.fileName || 'unknown_file_name',
    lineno: stackFrame.lineNumber,
    colno: stackFrame.columnNumber,
    method: stackFrame.functionName,
  };
}
