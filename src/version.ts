import { readFileSync } from "node:fs";

const metadata = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  version?: unknown;
};

if (typeof metadata.version !== "string") throw new Error("package.json has no version");

export const SERVER_VERSION = metadata.version;
