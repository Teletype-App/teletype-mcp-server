export type MessageValue = string | number | boolean | bigint | null | undefined;

export type CatalogShape<T> = {
  [K in keyof T]: T[K] extends (params: infer P) => string ? (params: P) => string : string;
};
