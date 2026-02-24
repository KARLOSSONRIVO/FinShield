"""
Standalone Anomaly Detection Layer test and benchmark script.

What it covers:
1. Functional checks for anomaly verdict behavior
2. Optional ML-hybrid path validation
3. Throughput benchmark with bottleneck hints

Run examples:
  python TESTS/test_anomaly_layer.py
  python TESTS/test_anomaly_layer.py --iterations 150 --with-ml
"""

import argparse
import asyncio
import os
import statistics
import sys
import time
from dataclasses import dataclass
from typing import Callable, Dict, List, Optional
from unittest.mock import patch
import importlib.util
import types


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


_ensure_env_defaults()


def _ensure_pydantic_settings_stub() -> None:
    try:
        import pydantic_settings  # noqa: F401
    except ImportError:
        module = types.ModuleType("pydantic_settings")

        class BaseSettings:
            def __init__(self, **kwargs):
                for key, value in self.__class__.__dict__.items():
                    if key.startswith("_") or callable(value):
                        continue
                    setattr(self, key, kwargs.get(key, value))

        module.BaseSettings = BaseSettings
        sys.modules["pydantic_settings"] = module


_ensure_pydantic_settings_stub()


def _ensure_optional_dependency_stubs() -> None:
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

            def setex(self, *_args, **_kwargs):
                return None

            def get(self, *_args, **_kwargs):
                return None

            def delete(self, *_args, **_kwargs):
                return 0

            def keys(self, *_args, **_kwargs):
                return []

            def publish(self, *_args, **_kwargs):
                return 0

            def close(self):
                return None

        redis_module.Redis = _DummyRedis
        redis_module.from_url = lambda *_args, **_kwargs: _DummyRedis()
        sys.modules["redis"] = redis_module


_ensure_optional_dependency_stubs()

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


class _FakeIsolationForest:
    def __init__(self, raw_score: float = 0.35):
        self.raw_score = raw_score

    def decision_function(self, _rows):
        return [self.raw_score]


@dataclass
class CaseResult:
    name: str
    passed: bool
    elapsed_ms: float
    score: float
    verdict: str
    flags: List[str]


def _build_invoice(kind: str) -> Dict:
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

    if kind == "mismatch":
        base["invoiceNumber"] = "2026003"
        base["totalAmount"] = 2000.0
        base["total"] = 2000.0
        return base

    return base


async def _run_case(
    name: str,
    layer: AnomalyDetectionLayer,
    context: Dict,
    predicate: Callable,
) -> CaseResult:
    started = time.perf_counter()
    result = await layer.analyze(context)
    elapsed_ms = (time.perf_counter() - started) * 1000
    verdict = result.verdict.value
    flags = result.flags or []
    passed = predicate(result)
    return CaseResult(
        name=name,
        passed=passed,
        elapsed_ms=elapsed_ms,
        score=float(result.score),
        verdict=verdict,
        flags=flags,
    )


async def _benchmark(iterations: int, with_ml: bool) -> Dict[str, float]:
    layer = AnomalyDetectionLayer(db=_MockDB())
    context = {
        "organization_id": "org_test_001",
        "invoice_data": _build_invoice("clean"),
        "raw_text": "Invoice Number 2026001\nTotal 1250.75",
    }
    model = _FakeIsolationForest(raw_score=0.5) if with_ml else None
    target = "app.pipelines.verification.stages.anomaly.layer.get_model_from_s3"

    latencies = []
    with patch(target, return_value=model):
        for _ in range(iterations):
            started = time.perf_counter()
            await layer.analyze(context)
            latencies.append((time.perf_counter() - started) * 1000)

    latencies.sort()
    avg = statistics.mean(latencies)
    p95 = latencies[min(len(latencies) - 1, int(iterations * 0.95))]
    return {
        "avg_ms": avg,
        "min_ms": latencies[0],
        "max_ms": latencies[-1],
        "p95_ms": p95,
    }


def _print_case(case: CaseResult) -> None:
    status = "PASS" if case.passed else "FAIL"
    print(
        f"[{status}] {case.name}: "
        f"score={case.score:.4f} verdict={case.verdict} "
        f"time={case.elapsed_ms:.2f}ms flags={case.flags}"
    )


def _print_bottleneck_hints(metrics: Dict[str, float], total_runtime_ms: float, iterations: int) -> bool:
    print("\nResults:")
    print(
        f"  avg={metrics['avg_ms']:.2f}ms min={metrics['min_ms']:.2f}ms "
        f"max={metrics['max_ms']:.2f}ms p95={metrics['p95_ms']:.2f}ms"
    )
    reasons = []
    if metrics["avg_ms"] > 40:
        reasons.append(f"average latency {metrics['avg_ms']:.2f}ms exceeded threshold 40.00ms")
    if metrics["p95_ms"] > 100:
        reasons.append(f"p95 latency {metrics['p95_ms']:.2f}ms exceeded threshold 100.00ms")

    detected = len(reasons) > 0
    throughput = iterations / (total_runtime_ms / 1000.0) if total_runtime_ms > 0 else 0.0

    print(
        f"  final_speed=total_runtime:{total_runtime_ms:.2f}ms, "
        f"throughput:{throughput:.2f} iterations/s"
    )
    return detected


async def _main(args: argparse.Namespace) -> int:
    run_started = time.perf_counter()
    layer = AnomalyDetectionLayer(db=_MockDB())
    target = "app.pipelines.verification.stages.anomaly.layer.get_model_from_s3"

    cases = []

    with patch(target, return_value=None):
        cases.append(
            await _run_case(
                "clean invoice should pass",
                layer,
                {
                    "organization_id": "org_test_001",
                    "invoice_data": _build_invoice("clean"),
                    "raw_text": "Invoice Number 2026001\nTotal 1250.75",
                },
                lambda r: r.verdict.value == "pass" and r.score >= 0.75,
            )
        )

        cases.append(
            await _run_case(
                "round and future invoice should degrade",
                layer,
                {
                    "organization_id": "org_test_001",
                    "invoice_data": _build_invoice("round_future"),
                    "raw_text": "Invoice Number 2026002\nTotal 5000.00",
                },
                lambda r: r.score < 0.95 and (r.flags or []),
            )
        )

        cases.append(
            await _run_case(
                "missing organization id should fail",
                layer,
                {"invoice_data": _build_invoice("clean"), "raw_text": ""},
                lambda r: r.verdict.value == "fail" and r.score == 0.0,
            )
        )

    if args.with_ml:
        with patch(target, return_value=_FakeIsolationForest(raw_score=0.4)):
            cases.append(
                await _run_case(
                    "ml hybrid path should execute",
                    layer,
                    {
                        "organization_id": "org_test_001",
                        "invoice_data": _build_invoice("mismatch"),
                        "raw_text": "Invoice Number 2026003\nTotal 2000.00",
                    },
                    lambda r: "ml_anomaly" in r.details and r.score >= 0.0,
                )
            )

    print("\nAnomaly layer checks:")
    for case in cases:
        _print_case(case)

    benchmark = await _benchmark(args.iterations, with_ml=args.with_ml)
    total_runtime_ms = (time.perf_counter() - run_started) * 1000
    _print_bottleneck_hints(benchmark, total_runtime_ms=total_runtime_ms, iterations=args.iterations)

    failed = [c for c in cases if not c.passed]
    print(f"\nSummary: {len(cases) - len(failed)}/{len(cases)} checks passed")
    return 1 if failed else 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test and benchmark FinShield anomaly detection layer")
    parser.add_argument("--iterations", type=int, default=100, help="Benchmark iterations")
    parser.add_argument("--with-ml", action="store_true", help="Enable ML-hybrid validation paths")
    cli_args = parser.parse_args()
    raise SystemExit(asyncio.run(_main(cli_args)))
