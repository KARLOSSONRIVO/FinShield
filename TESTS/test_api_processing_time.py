"""
Generic API latency profiler for FinShield endpoints.

Examples:
  python TESTS/test_api_processing_time.py --url http://localhost:5000/health
  python TESTS/test_api_processing_time.py --url http://localhost:8000/precheck --method POST --file ./sample.pdf
  python TESTS/test_api_processing_time.py --url http://localhost:5000/invoice/list --token <JWT>
"""

import argparse
import json
import os
import statistics
import sys
import time
from typing import Dict, List, Optional, Tuple

import requests


def _parse_form_pairs(pairs: List[str]) -> Dict[str, str]:
    data: Dict[str, str] = {}
    for pair in pairs:
        if "=" not in pair:
            raise ValueError(f"Invalid --form value '{pair}'. Use key=value format.")
        key, value = pair.split("=", 1)
        data[key] = value
    return data


def _single_call(
    method: str,
    url: str,
    headers: Dict[str, str],
    json_body: Optional[Dict],
    form_data: Dict[str, str],
    file_path: Optional[str],
    file_field: str,
    timeout: int,
    verify_ssl: bool,
) -> Tuple[float, int, str]:
    files = None
    if file_path:
        filename = os.path.basename(file_path)
        files = {file_field: (filename, open(file_path, "rb"))}

    started = time.perf_counter()
    try:
        response = requests.request(
            method=method,
            url=url,
            headers=headers,
            json=json_body,
            data=form_data if form_data else None,
            files=files,
            timeout=timeout,
            verify=verify_ssl,
        )
        latency_ms = (time.perf_counter() - started) * 1000
        return latency_ms, response.status_code, response.text[:250]
    finally:
        if files:
            files[file_field][1].close()


def _print_summary(
    latencies: List[float],
    statuses: List[int],
    errors: int,
    args: argparse.Namespace,
    total_runtime_ms: float,
) -> bool:
    latencies_sorted = sorted(latencies)
    avg_ms = statistics.mean(latencies_sorted)
    min_ms = latencies_sorted[0]
    max_ms = latencies_sorted[-1]
    p95_ms = latencies_sorted[min(len(latencies_sorted) - 1, int(len(latencies_sorted) * 0.95))]
    stdev_ms = statistics.pstdev(latencies_sorted) if len(latencies_sorted) > 1 else 0.0
    success = sum(1 for s in statuses if 200 <= s < 400)
    error_rate = (errors / len(statuses)) * 100

    print("\nSummary:")
    print(f"  calls: {len(latencies)}")
    print(f"  success: {success}/{len(statuses)}")
    print(f"  avg: {avg_ms:.2f}ms")
    print(f"  min: {min_ms:.2f}ms")
    print(f"  max: {max_ms:.2f}ms")
    print(f"  p95: {p95_ms:.2f}ms")
    print(f"  stdev: {stdev_ms:.2f}ms")
    print(f"  error_rate: {error_rate:.2f}%")

    print("\nResults:")
    reasons = []
    if error_rate > 0:
        reasons.append(f"request failures occurred ({errors}/{len(statuses)})")
    if avg_ms > args.warn_avg_ms:
        reasons.append(f"average latency {avg_ms:.2f}ms exceeded threshold {args.warn_avg_ms:.2f}ms")
    if p95_ms > args.warn_p95_ms:
        reasons.append(f"p95 latency {p95_ms:.2f}ms exceeded threshold {args.warn_p95_ms:.2f}ms")

    detected = len(reasons) > 0
    throughput = len(latencies) / (total_runtime_ms / 1000.0) if total_runtime_ms > 0 else 0.0

    print(
        f"  final_speed=total_runtime:{total_runtime_ms:.2f}ms, "
        f"throughput:{throughput:.2f} requests/s"
    )
    return detected


def main() -> int:
    parser = argparse.ArgumentParser(description="Measure API call processing time and flag latency bottlenecks")
    parser.add_argument("--url", help="Target endpoint URL")
    parser.add_argument("--method", default="GET", choices=["GET", "POST", "PUT", "PATCH", "DELETE"])
    parser.add_argument("--repeats", type=int, default=10, help="Number of API calls to run")
    parser.add_argument("--timeout", type=int, default=120, help="Per-request timeout (seconds)")
    parser.add_argument("--token", help="Bearer token")
    parser.add_argument("--json", dest="json_str", help="JSON body as string")
    parser.add_argument("--json-file", help="Path to JSON file body")
    parser.add_argument("--form", action="append", default=[], help="Form field key=value, repeatable")
    parser.add_argument("--file", help="File path for multipart upload")
    parser.add_argument("--file-field", default="file", help="Multipart file field name")
    parser.add_argument("--sleep-ms", type=int, default=0, help="Delay between calls")
    parser.add_argument("--insecure", action="store_true", help="Disable SSL verification")
    parser.add_argument("--warn-avg-ms", type=float, default=2000.0, help="Avg latency warning threshold")
    parser.add_argument("--warn-p95-ms", type=float, default=5000.0, help="P95 latency warning threshold")
    args = parser.parse_args()

    if not args.url:
        args.url = os.getenv("API_TEST_URL", "http://localhost:5000/health")
        print(f"No --url provided. Using default URL: {args.url}")

    headers = {"Accept": "application/json"}
    if args.token:
        headers["Authorization"] = f"Bearer {args.token}"

    json_body: Optional[Dict] = None
    if args.json_str:
        json_body = json.loads(args.json_str)
    if args.json_file:
        with open(args.json_file, "r", encoding="utf-8") as handle:
            json_body = json.load(handle)

    form_data = _parse_form_pairs(args.form)
    latencies: List[float] = []
    statuses: List[int] = []
    errors = 0
    run_started = time.perf_counter()

    print("API timing run:")
    print(f"  method={args.method} url={args.url}")
    print(f"  repeats={args.repeats} timeout={args.timeout}s")

    for index in range(1, args.repeats + 1):
        try:
            latency_ms, status, preview = _single_call(
                method=args.method,
                url=args.url,
                headers=headers,
                json_body=json_body,
                form_data=form_data,
                file_path=args.file,
                file_field=args.file_field,
                timeout=args.timeout,
                verify_ssl=not args.insecure,
            )
            latencies.append(latency_ms)
            statuses.append(status)
            print(f"[{index:03d}] status={status} time={latency_ms:.2f}ms")
            if status >= 400:
                print(f"      response_preview={preview!r}")
        except Exception as exc:
            errors += 1
            statuses.append(0)
            latencies.append(args.timeout * 1000.0)
            print(f"[{index:03d}] ERROR: {exc}")

        if args.sleep_ms > 0 and index < args.repeats:
            time.sleep(args.sleep_ms / 1000.0)

    total_runtime_ms = (time.perf_counter() - run_started) * 1000
    _print_summary(latencies, statuses, errors, args, total_runtime_ms=total_runtime_ms)
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
