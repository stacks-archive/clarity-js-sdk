import * as readline from "readline";
import {
  finished,
  PassThrough,
  pipeline,
  Readable,
  Transform,
  Writable,
  WritableOptions
} from "stream";
import { promisify } from "util";

export const pipelineAsync = promisify(pipeline);

export class MemoryStream extends Writable {
  buffers: Buffer[] = [];
  constructor(opts?: WritableOptions) {
    super(opts);
  }
  _write(chunk: any, encoding: string, callback: (error?: Error | null) => void): void {
    if (chunk instanceof Buffer) {
      this.buffers.push(chunk);
    } else {
      this.buffers.push(Buffer.from(chunk, encoding));
    }
    callback(null);
  }
  getData() {
    if (this.buffers.length === 1) {
      return this.buffers[0];
    }
    return Buffer.concat(this.buffers);
  }
}

export async function readStream(
  stream: Readable,
  ignoreErrors = false,
  monitorCallback?: (data: string) => void
): Promise<Buffer> {
  const memStream = new MemoryStream();
  async function startReadInternal() {
    const streamArr: (NodeJS.ReadableStream | NodeJS.WritableStream)[] = [stream];
    if (monitorCallback) {
      const passThrough = new PassThrough();
      /*
      passThrough.on("data", chunk => {
        if (chunk instanceof Buffer) {
          monitorCallback(chunk.toString("utf8"));
        } else if (typeof chunk === "string") {
          monitorCallback(chunk);
        } else {
          monitorCallback(chunk.toString());
        }
      });
      */
      const readStreamLine = readline.createInterface({
        input: passThrough,
        crlfDelay: Infinity
      });
      readStreamLine.on("line", lineData => {
        monitorCallback(lineData);
      });

      /*const monitorStream = new Transform({
        transform: (chunk, encoding, callback) => {
          monitorCallback(chunk instanceof Buffer ? chunk : Buffer.from(chunk, encoding));
          callback(undefined, chunk);
        }
      });
      streamArr.push(monitorStream);*/
      streamArr.push(passThrough);
    }
    streamArr.push(memStream);
    await pipelineAsync(streamArr);
  }
  if (ignoreErrors) {
    try {
      await startReadInternal();
    } catch (error) {
      console.log(`ignored readStream error: ${error}`);
    }
  } else {
    await startReadInternal();
  }
  return memStream.getData();
}
