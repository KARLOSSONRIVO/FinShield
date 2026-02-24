"""
Force and detect a subtle bottleneck in Anomaly Detection Layer.

Run:
  python bottlenect/anomaly_layer_bottleneck.py
"""

import argparse
import asyncio
import importlib.util
import os
import statistics
import sys
import time
import types
from typing import Any, Dict, List
from unittest.mock import patch


def _ensure_env_defaults() -> None:
    defaults = {
        "SERVICE_URL": "http://localhost:8000",
        "MONGO_URI": "mongodb://localhost:27017",
        "MONGO_DB": "finshield",
        "IPFS_GATEWAY_BASE": "https://gateway.pinata.cloud/ipfs",
        "CHAIN_RPC_URL": "http://localhost:8545",
        "AWS_ACCESS_KEY_ID": "dummy",
        "AWS_SECRET_ACCESS_KEY": "dummy",
        "AWS_REGION": "us-east-1",
        "MODEL_BUCKET_NAME": "finshield-models",
        "ANOMALY_MIN_INVOICES": "20",
        "ANOMALY_MATH_TOLERANCE": "0.02",
        "ANOMALY_MAX_TRAINING_SAMPLES": "5000",
        "ANOMALY_RECENT_WEIGHT": "0.8",
        "ANOMALY_RECENT_DAYS": "90",
        "MAX_PARALLEL_TRAINING": "3",
        "ANOMALY_MIN_NEW_INVOICES": "500",
        "ANOMALY_RETRAIN_INTERVAL_DAYS": "7",
    }
    for key, value in defaults.items():
        os.environ.setdefault(key, value)


def _ensure_stubs() -> None:
    try:
        import pydantic_settings  # noqa: F401
    except ImportError:
        mod = types.ModuleType("pydantic_settings")

        class BaseSettings:
            def __init__(self, **kwargs):
                for key, value in self.__class__.__dict__.items():
                    if key.startswith("_") or callable(value):
                        continue
                    setattr(self, key, kwargs.get(key, value))

        mod.BaseSettings = BaseSettings
        sys.modules["pydantic_settings"] = mod

    if importlib.util.find_spec("joblib") is None:
        joblib_module = types.ModuleType("joblib")
        joblib_module.load = lambda *_args, **_kwargs: None
        joblib_module.dump = lambda *_args, **_kwargs: None
        sys.modules["joblib"] = joblib_module

    if importlib.util.find_spec("boto3") is None:
        boto3_module = types.ModuleType("boto3")

        class _DummyS3:
            def download_fileobj(self, *_args, **_kwargs):
                raise RuntimeError("boto3 is not installed")

            def upload_fileobj(self, *_args, **_kwargs):
                return None

        boto3_module.client = lambda *_args, **_kwargs: _DummyS3()
        sys.modules["boto3"] = boto3_module

    if importlib.util.find_spec("botocore") is None:
        botocore_module = types.ModuleType("botocore")
        exceptions_module = types.ModuleType("botocore.exceptions")

        class ClientError(Exception):
            pass

        exceptions_module.ClientError = ClientError
        botocore_module.exceptions = exceptions_module
        sys.modules["botocore"] = botocore_module
        sys.modules["botocore.exceptions"] = exceptions_module

    if importlib.util.find_spec("redis") is None:
        redis_module = types.ModuleType("redis")

        class _DummyRedis:
            def ping(self):
                return False

            def close(self):
                return None

        redis_module.Redis = _DummyRedis
        redis_module.from_url = lambda *_args, **_kwargs: _DummyRedis()
        sys.modules["redis"] = redis_module


_ensure_env_defaults()
_ensure_stubs()

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
AI_SERVICE_ROOT = os.path.join(PROJECT_ROOT, "AI_SERVICE")
if AI_SERVICE_ROOT not in sys.path:
    sys.path.insert(0, AI_SERVICE_ROOT)

from app.pipelines.verification.stages.anomaly.layer import AnomalyDetectionLayer  # noqa: E402


class _MockInvoices:
    def find_one(self, *_args, **_kwargs):
        return None


class _MockDB:
    def __init__(self):
        self.invoices = _MockInvoices()


def _build_invoice(kind: str) -> Dict[str, Any]:
    base = {
        "invoiceNumber": "2026001",
        "invoiceDate": "2026-02-10",
        "date": "2026-02-10",
        "totalAmount": 1250.75,
        "total": 1250.75,
        "subtotal": 1120.32,
        "tax": 130.43,
        "issuedTo": "Acme Corp",
        "lineItems": [
            {"description": "Subscription", "qty": 1, "unitPrice": 850.0, "amount": 850.0},
            {"description": "Support", "qty": 1, "unitPrice": 270.32, "amount": 270.32},
        ],
    }

    if kind == "round_future":
        base["invoiceNumber"] = "2026002"
        base["invoiceDate"] = "2027-12-01"
        base["date"] = "2027-12-01"
        base["totalAmount"] = 5000.0
        base["total"] = 5000.0
        base["subtotal"] = 4700.0
        base["tax"] = 300.0
        return base

    return base


def _context() -> Dict[str, Any]:
    return {
        "organization_id": "org_bottle_001",
        "invoice_data": {
            "invoiceNumber": "2026501",
            "date": "2026-02-15",
            "total": 1250.75,
            "subtotal": 1120.32,
            "tax": 130.43,
            "lineItems": [
                {"description": "A", "qty": 1, "unitPrice": 850.0, "amount": 850.0},
                {"description": "B", "qty": 1, "unitPrice": 270.32, "amount": 270.32},
            ],
        },
        "raw_text": "Invoice 2026501 total 1250.75",
    }


def _stats(values: List[float]) -> Dict[str, float]:
    values = sorted(values)
    return {
        "avg_ms": statistics.mean(values),
        "min_ms": values[0],
        "max_ms": values[-1],
        "p95_ms": values[min(len(values) - 1, int(len(values) * 0.95))],
    }


async def main(args: argparse.Namespace) -> int:
    layer = AnomalyDetectionLayer(db=_MockDB())
    target = "app.pipelines.verification.stages.anomaly.layer.get_model_from_s3"

    # Functional checks (same style as non-bottleneck tester)
    checks = []
    with patch(target, return_value=None):
        started = time.perf_counter()
        r1 = await layer.analyze({
            "organization_id": "org_test_001",
            "invoice_data": _build_invoice("clean"),
            "raw_text": "Invoice Number 2026001\nTotal 1250.75",
        })
        checks.append(("clean invoice should pass", r1.verdict.value == "pass" and r1.score >= 0.75, r1, (time.perf_counter() - started) * 1000))

        started = time.perf_counter()
        r2 = await layer.analyze({
            "organization_id": "org_test_001",
            "invoice_data": _build_invoice("round_future"),
            "raw_text": "Invoice Number 2026002\nTotal 5000.00",
        })
        checks.append(("round and future invoice should degrade", r2.score < 0.95 and (r2.flags or []), r2, (time.perf_counter() - started) * 1000))

        started = time.perf_counter()
        r3 = await layer.analyze({"invoice_data": _build_invoice("clean"), "raw_text": ""})
        checks.append(("missing organization id should fail", r3.verdict.value == "fail" and r3.score == 0.0, r3, (time.perf_counter() - started) * 1000))

    # Bottleneck benchmark
    run_started = time.perf_counter()
    latencies = []
    with patch(target, return_value=None):
        for _ in range(args.iterations):
            started = time.perf_counter()
            await asyncio.sleep(args.delay_ms / 1000.0)
            await layer.analyze(_context())
            latencies.append((time.perf_counter() - started) * 1000)

    metrics = _stats(latencies)
    reasons = []
    if metrics["avg_ms"] > args.warn_avg_ms:
        reasons.append(
            f"average latency {metrics['avg_ms']:.2f}ms exceeded threshold {args.warn_avg_ms:.2f}ms"
        )
    if metrics["p95_ms"] > args.warn_p95_ms:
        reasons.append(
            f"p95 latency {metrics['p95_ms']:.2f}ms exceeded threshold {args.warn_p95_ms:.2f}ms"
        )
    detected = len(reasons) > 0
    observed_total_runtime_ms = (time.perf_counter() - run_started) * 1000
    injected_total_delay_ms = args.delay_ms * args.iterations
    processing_only_runtime_ms = max(0.0, observed_total_runtime_ms - injected_total_delay_ms)
    throughput = (
        args.iterations / (processing_only_runtime_ms / 1000.0)
        if processing_only_runtime_ms > 0
        else 0.0
    )
    print("\nAnomaly layer checks:")
    for name, passed, result, elapsed in checks:
        status = "PASS" if passed else "FAIL"
        print(
            f"[{status}] {name}: score={float(result.score):.4f} "
            f"verdict={result.verdict.value} time={elapsed:.2f}ms flags={result.flags or []}"
        )
    print("\nResults:")
    print(
        f"  avg={metrics['avg_ms']:.2f}ms min={metrics['min_ms']:.2f}ms "
        f"max={metrics['max_ms']:.2f}ms p95={metrics['p95_ms']:.2f}ms"
    )
    print(f"  thresholds: avg>{args.warn_avg_ms}ms or p95>{args.warn_p95_ms}ms")
    print(
        f"  final_speed=processing_runtime:{processing_only_runtime_ms:.2f}ms, "
        f"throughput:{throughput:.2f} iterations/s"
    )
    passed_count = sum(1 for _, p, _, _ in checks if p) + (1 if detected else 0)
    total_count = len(checks) + 1
    print(f"\nSummary: {passed_count}/{total_count} checks passed")
    return 0 if passed_count == total_count else 1


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    # Tuned for subtle runtime under 60ms by default
    parser.add_argument("--iterations", type=int, default=1)
    parser.add_argument("--delay-ms", type=float, default=45.0)
    parser.add_argument("--warn-avg-ms", type=float, default=40.0)
    parser.add_argument("--warn-p95-ms", type=float, default=100.0)
    raise SystemExit(asyncio.run(main(parser.parse_args())))
