import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { chmodSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import type { DatabaseSync } from "node:sqlite";
import type { OAuthClientInformationFull } from "@modelcontextprotocol/sdk/shared/auth.js";

interface Consent {
  clientId: string;
  redirectUri: string;
  challenge: string;
  state?: string;
  scopes: string[];
  cookieHash: string;
  expiresAt: number;
}
interface Grant {
  clientId: string;
  apiToken: string;
  scopes: string[];
  expiresAt: number;
  currentRefresh?: string;
}
interface Records {
  client: OAuthClientInformationFull;
  consent: Consent;
  code: { consent: Consent; grantId: string; expiresAt: number };
  grant: Grant;
  access: { grantId: string; expiresAt: number };
}
type Kind = keyof Records;

// Short synchronous transactions serialize code exchange, refresh rotation and
// revocation across connections. No transaction remains open during an API call.
export class OAuthStore {
  private readonly db: DatabaseSync;
  private readonly key: Buffer;

  constructor(file: string, encryptionKey: string, resource: string) {
    this.key = Buffer.from(encryptionKey, "hex");
    if (this.key.length !== 32) throw new Error("OAuth encryption key must contain 32 bytes.");
    let sqlite: typeof import("node:sqlite");
    try {
      sqlite = createRequire(import.meta.url)("node:sqlite") as typeof import("node:sqlite");
    } catch {
      throw new Error("OAuth requires Node.js 22.13+ or 24.x with node:sqlite support.");
    }
    const path = resolve(file);
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.db = new sqlite.DatabaseSync(path);
    try {
      chmodSync(path, 0o600);
      this.db.exec(
        "PRAGMA busy_timeout=5000; PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL;",
      );
      const version = this.db.prepare("PRAGMA user_version").get()?.user_version;
      if (version !== 0 && version !== 1) throw new Error("Unsupported OAuth database version.");
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS oauth_records (
          kind TEXT NOT NULL, id TEXT NOT NULL, payload BLOB NOT NULL,
          expires_at INTEGER NOT NULL, grant_id TEXT,
          PRIMARY KEY (kind, id)
        );
        CREATE INDEX IF NOT EXISTS oauth_records_expiry ON oauth_records(expires_at);
        CREATE INDEX IF NOT EXISTS oauth_records_grant ON oauth_records(grant_id);
        CREATE TABLE IF NOT EXISTS oauth_meta (id TEXT PRIMARY KEY, payload BLOB NOT NULL);
        PRAGMA user_version=1;
      `);
      this.transaction(() => {
        const sentinel = this.db
          .prepare("SELECT payload FROM oauth_meta WHERE id='key-check'")
          .get();
        if (sentinel) {
          if (
            this.decrypt(sentinel.payload as Uint8Array, "key-check") !==
            "teletype-oauth-v1:" + resource
          )
            throw new Error("Invalid OAuth key.");
        } else {
          this.db
            .prepare("INSERT INTO oauth_meta(id,payload) VALUES('key-check',?)")
            .run(this.encrypt("teletype-oauth-v1:" + resource, "key-check"));
        }
      });
    } catch {
      this.db.close();
      throw new Error(
        "Cannot open OAuth database. Check its format, encryption key and public URL.",
      );
    }
  }

  private encrypt(value: unknown, identity: string): Buffer {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    cipher.setAAD(Buffer.from(identity));
    const ciphertext = Buffer.concat([
      cipher.update(JSON.stringify(value), "utf8"),
      cipher.final(),
    ]);
    return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]);
  }

  private decrypt(value: Uint8Array, identity: string): unknown {
    const bytes = Buffer.from(value);
    const decipher = createDecipheriv("aes-256-gcm", this.key, bytes.subarray(0, 12));
    decipher.setAAD(Buffer.from(identity));
    decipher.setAuthTag(bytes.subarray(12, 28));
    return JSON.parse(
      Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString("utf8"),
    ) as unknown;
  }

  get<K extends Kind>(kind: K, id: string): Records[K] | undefined {
    const row = this.db
      .prepare(
        "SELECT payload, expires_at, grant_id FROM oauth_records WHERE kind=? AND id=? AND (expires_at=0 OR expires_at>?)",
      )
      .get(kind, id, Math.floor(Date.now() / 1000));
    if (!row) return undefined;
    return this.decrypt(
      row.payload as Uint8Array,
      JSON.stringify([kind, id, row.expires_at, row.grant_id]),
    ) as Records[K];
  }

  put<K extends Kind>(
    kind: K,
    id: string,
    value: Records[K],
    expiresAt: number,
    grantId?: string,
  ): void {
    const payload = this.encrypt(value, JSON.stringify([kind, id, expiresAt, grantId ?? null]));
    this.db
      .prepare(
        "INSERT INTO oauth_records(kind,id,payload,expires_at,grant_id) VALUES(?,?,?,?,?) ON CONFLICT(kind,id) DO UPDATE SET payload=excluded.payload, expires_at=excluded.expires_at, grant_id=excluded.grant_id",
      )
      .run(kind, id, payload, expiresAt, grantId ?? null);
  }

  remove(kind: Kind, id: string): void {
    this.db.prepare("DELETE FROM oauth_records WHERE kind=? AND id=?").run(kind, id);
  }

  revokeGrant(id: string): void {
    this.db
      .prepare("DELETE FROM oauth_records WHERE (kind='grant' AND id=?) OR grant_id=?")
      .run(id, id);
  }

  hasPersistentGrant(clientId: string): boolean {
    const rows = this.db
      .prepare("SELECT id FROM oauth_records WHERE kind='grant' AND expires_at=0")
      .all();
    return rows.some((row) => this.get("grant", String(row.id))?.clientId === clientId);
  }

  count(kind: Kind): number {
    return Number(
      this.db
        .prepare(
          "SELECT COUNT(*) AS n FROM oauth_records WHERE kind=? AND (expires_at=0 OR expires_at>?)",
        )
        .get(kind, Math.floor(Date.now() / 1000))?.n,
    );
  }

  transaction<T>(operation: () => T): T {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      this.db
        .prepare("DELETE FROM oauth_records WHERE expires_at>0 AND expires_at<=?")
        .run(Math.floor(Date.now() / 1000));
      const result = operation();
      this.db.exec("COMMIT");
      return result;
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  close(): void {
    this.db.close();
  }
}
