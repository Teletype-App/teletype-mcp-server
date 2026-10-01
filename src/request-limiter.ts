export class RequestLimiter {
  private active = 0;
  private readonly activeByKey = new Map<string, number>();

  constructor(
    private readonly globalLimit: number,
    private readonly perKeyLimit: number,
  ) {}

  acquire(key: string): (() => void) | undefined {
    const activeForKey = this.activeByKey.get(key) ?? 0;
    if (this.active >= this.globalLimit || activeForKey >= this.perKeyLimit) {
      return undefined;
    }

    this.active += 1;
    this.activeByKey.set(key, activeForKey + 1);
    let released = false;

    return () => {
      if (released) return;
      released = true;
      this.active -= 1;
      const next = (this.activeByKey.get(key) ?? 1) - 1;
      if (next === 0) this.activeByKey.delete(key);
      else this.activeByKey.set(key, next);
    };
  }
}
