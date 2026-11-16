// A request survives brief tracking loss, but never uses a known-invalid pose.
export class PlacementRequest<T> {
  pending = false;
  private latest?: { point: T; time: number };
  private requestedAt = 0;
  constructor(private now = () => performance.now(), private maxAgeMs = 100, private waitMs = 1500) {}
  request(): T | undefined {
    if (this.pending) return;
    this.pending = true;
    this.requestedAt = this.now();
    if (this.latest && this.now() - this.latest.time <= this.maxAgeMs) return this.take(this.latest.point);
  }
  update(point: T | undefined): T | undefined {
    this.latest = point === undefined ? undefined : { point, time: this.now() };
    if (this.pending && point !== undefined && this.now() - this.requestedAt <= this.waitMs) return this.take(point);
  }
  cancel() { this.pending = false; this.latest = undefined; }
  private take(point: T): T { this.cancel(); return point; }
}
