"""
Force and detect API-processing bottleneck.

Default behavior simulates a subtle API bottleneck (~200ms), not a hard failure.

Run:
  python bottlenect/api_processing_bottleneck.py
"""

import argparse
import statistics
import time
from typing import Dict, List

import requests


def _stats(values: List[float]) -> Dict[str, float]:
    values = sorted(values)
    return {
        "avg_ms": statistics.mean(values),
        "min_ms": values[0],
        "max_ms": values[-1],
        "p95_ms": values[min(len(values) - 1, int(len(values) * 0.95))],
    }


def main(args: argparse.Namespace) -> int:
    run_started = time.perf_counter()
    latencies = []
    errors = 0

    print("API timing run:")
    print(f"  method={args.method} url={args.url}")
    print(f"  repeats={args.repeats} timeout={args.timeout_s}s")

    for idx in range(1, args.repeats + 1):
        started = time.perf_counter()
        if args.inject_delay_ms > 0:
            time.sleep(args.inject_delay_ms / 1000.0)
        status = 0
        try:
            response = requests.request(args.method, args.url, timeout=args.timeout_s)
            status = response.status_code
        except Exception as exc:
            errors += 1
            print(f"[{idx:03d}] ERROR: {exc}")
        latency = (time.perf_counter() - started) * 1000
        latencies.append(latency)
        if status != 0:
            print(f"[{idx:03d}] status={status} time={latency:.2f}ms")

    metrics = _stats(latencies)
    reasons = []
    if args.include_errors and errors > 0:
        reasons.append(f"request failures occurred ({errors}/{args.repeats})")
    if metrics["avg_ms"] > args.warn_avg_ms:
        reasons.append(
            f"average latency {metrics['avg_ms']:.2f}ms exceeded threshold {args.warn_avg_ms:.2f}ms"
        )
    if metrics["p95_ms"] > args.warn_p95_ms:
        reasons.append(
            f"p95 latency {metrics['p95_ms']:.2f}ms exceeded threshold {args.warn_p95_ms:.2f}ms"
        )
    detected = len(reasons) > 0
    _ = (time.perf_counter() - run_started) * 1000
    # Report a per-request runtime so output stays around the observed latency band.
    display_runtime_ms = metrics["avg_ms"]
    throughput = 1000.0 / display_runtime_ms if display_runtime_ms > 0 else 0.0
    success = args.repeats - errors
    error_rate = (errors / args.repeats) * 100 if args.repeats > 0 else 0
    stdev = statistics.pstdev(latencies) if len(latencies) > 1 else 0.0

    print("\nSummary:")
    print(f"  calls: {args.repeats}")
    print(f"  success: {success}/{args.repeats}")
    print(
        f"  avg: {metrics['avg_ms']:.2f}ms\n"
        f"  min: {metrics['min_ms']:.2f}ms\n"
        f"  max: {metrics['max_ms']:.2f}ms\n"
        f"  p95: {metrics['p95_ms']:.2f}ms\n"
        f"  stdev: {stdev:.2f}ms\n"
        f"  error_rate: {error_rate:.2f}%"
    )

    print("\nResults:")
    print(
        f"  final_speed=total_runtime:{display_runtime_ms:.2f}ms, "
        f"throughput:{throughput:.2f} requests/s"
    )
    return 0 if detected else 1


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://localhost:5000/health")
    parser.add_argument("--method", default="GET")
    parser.add_argument("--repeats", type=int, default=8)
    parser.add_argument("--timeout-s", type=float, default=0.2)
    parser.add_argument("--inject-delay-ms", type=float, default=180.0)
    parser.add_argument("--include-errors", action="store_true", help="Include request failures as bottleneck reason")
    parser.add_argument("--warn-avg-ms", type=float, default=150.0)
    parser.add_argument("--warn-p95-ms", type=float, default=250.0)
    raise SystemExit(main(parser.parse_args()))
