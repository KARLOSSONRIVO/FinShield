"""
Run fraud-layer functional checks plus a subtle bottleneck scan.

Run:
  python bottlenect/fraud_layer_bottleneck.py
"""

import argparse
import asyncio
import importlib.util
import logging
import os
import re
import statistics
import sys
import time
import types
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Callable, Dict, List
from unittest.mock import patch

from bson import ObjectId


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
        module = types.ModuleType("pydantic_settings")

        class BaseSettings:
            def __init__(self, **kwargs):
                for key, value in self.__class__.__dict__.items():
                    if key.startswith("_") or callable(value):
                        continue
                    setattr(self, key, kwargs.get(key, value))

        module.BaseSettings = BaseSettings
        sys.modules["pydantic_settings"] = module

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


_ensure_env_defaults()
_ensure_stubs()
logging.disable(logging.CRITICAL)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
AI_SERVICE_ROOT = os.path.join(PROJECT_ROOT, "AI_SERVICE")
if AI_SERVICE_ROOT not in sys.path:
    sys.path.insert(0, AI_SERVICE_ROOT)

from app.pipelines.verification.stages.fraud.layer import FraudDetectionLayer  # noqa: E402


def _obj_to_str(value: Any) -> str:
    if isinstance(value, ObjectId):
        return str(value)
    return str(value)


class _Collection:
    def __init__(self, docs: List[Dict[str, Any]]):
        self.docs = docs

    def _matches(self, doc: Dict[str, Any], query: Dict[str, Any]) -> bool:
        for key, expected in query.items():
            value = doc.get(key)
            if isinstance(expected, dict):
                if "$ne" in expected and _obj_to_str(value) == _obj_to_str(expected["$ne"]):
                    return False
                if "$regex" in expected:
                    pattern = expected["$regex"]
                    flags = re.IGNORECASE if "i" in expected.get("$options", "") else 0
                    if value is None or re.search(pattern, str(value), flags) is None:
                        return False
                if "$gte" in expected and not (value is not None and value >= expected["$gte"]):
                    return False
                if "$lte" in expected and not (value is not None and value <= expected["$lte"]):
                    return False
                if "$lt" in expected and not (value is not None and value < expected["$lt"]):
                    return False
                continue
            if _obj_to_str(value) != _obj_to_str(expected):
                return False
        return True

    def find_one(self, query: Dict[str, Any], **_kwargs):
        for doc in self.docs:
            if self._matches(doc, query):
                return doc
        return None

    def count_documents(self, query: Dict[str, Any]) -> int:
        return sum(1 for doc in self.docs if self._matches(doc, query))


class _MockDB:
    def __init__(self):
        self.org_id = ObjectId("65f000000000000000000001")
        self.invoices = _Collection(
            [
                {
                    "_id": ObjectId("65f000000000000000000101"),
                    "orgId": self.org_id,
                    "invoiceNumber": "INV-1001",
                    "issuedTo": "Acme Corp",
                    "fileHashSha256": "f" * 64,
                    "totalAmount": 1200.0,
                    "invoiceDate": "2026-02-10",
                    "createdAt": datetime.now(timezone.utc) - timedelta(days=2),
                    "reviewDecision": "approved",
                },
                {
                    "_id": ObjectId("65f000000000000000000102"),
                    "orgId": self.org_id,
                    "invoiceNumber": "INV-1002",
                    "issuedTo": "Acme Corp",
                    "fileHashSha256": "e" * 64,
                    "totalAmount": 950.0,
                    "invoiceDate": "2026-02-05",
                    "createdAt": datetime.now(timezone.utc) - timedelta(days=6),
                    "reviewDecision": "approved",
                },
            ]
        )
        self.organizations = _Collection(
            [
                {
                    "_id": self.org_id,
                    "approvedCustomers": ["Acme Corp", "Bright Supplies Inc"],
                }
            ]
        )


@dataclass
class CaseResult:
    name: str
    passed: bool
    elapsed_ms: float
    score: float
    verdict: str
    flags: List[str]


def _build_invoice(kind: str) -> Dict[str, Any]:
    base = {
        "invoiceNumber": "INV-2001",
        "invoiceDate": "2026-02-20",
        "totalAmount": 1325.55,
        "subtotal": 1200.0,
        "tax": 125.55,
        "issuedTo": "Acme Corp",
        "lineItems": [
            {"description": "Service Fee", "qty": 1, "unitPrice": 1200.0, "amount": 1200.0}
        ],
        "fileHashSha256": "a" * 64,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }

    if kind == "duplicate":
        base["invoiceNumber"] = "INV-1001"
        base["fileHashSha256"] = "f" * 64
        base["totalAmount"] = 1200.0
        base["issuedTo"] = "Acme Corp"
        return base

    if kind == "unknown_customer":
        base["invoiceNumber"] = "INV-3001"
        base["issuedTo"] = "Unknown Vendor LLC"
        base["fileHashSha256"] = "b" * 64
        return base

    return base


async def _run_case(
    name: str,
    layer: FraudDetectionLayer,
    context: Dict[str, Any],
    predicate: Callable,
) -> CaseResult:
    started = time.perf_counter()
    result = await layer.analyze(context)
    elapsed_ms = (time.perf_counter() - started) * 1000
    passed = predicate(result)
    return CaseResult(
        name=name,
        passed=passed,
        elapsed_ms=elapsed_ms,
        score=float(result.score),
        verdict=result.verdict.value,
        flags=result.flags or [],
    )


def _print_case(case: CaseResult) -> None:
    status = "PASS" if case.passed else "FAIL"
    print(
        f"[{status}] {case.name}: "
        f"score={case.score:.4f} verdict={case.verdict} "
        f"time={case.elapsed_ms:.2f}ms flags={case.flags}"
    )


def _stats(values: List[float]) -> Dict[str, float]:
    values = sorted(values)
    return {
        "avg_ms": statistics.mean(values),
        "min_ms": values[0],
        "max_ms": values[-1],
        "p95_ms": values[min(len(values) - 1, int(len(values) * 0.95))],
    }


async def _benchmark(iterations: int, delay_ms: float) -> Dict[str, float]:
    db = _MockDB()
    layer = FraudDetectionLayer(db=db)
    context = {
        "organization_id": str(db.org_id),
        "invoice_id": "65f000000000000000000999",
        "invoice_data": _build_invoice("clean"),
    }
    target = "app.pipelines.verification.stages.fraud.layer.get_fraud_model"

    latencies = []
    with patch(target, return_value=None):
        for _ in range(iterations):
            started = time.perf_counter()
            if delay_ms > 0:
                await asyncio.sleep(delay_ms / 1000.0)
            await layer.analyze(context)
            latencies.append((time.perf_counter() - started) * 1000)

    return _stats(latencies)


def _print_bottleneck_scan(
    metrics: Dict[str, float],
    total_runtime_ms: float,
    iterations: int,
    warn_avg_ms: float,
    warn_p95_ms: float,
) -> bool:
    print("\nResults:")
    print(
        f"  avg={metrics['avg_ms']:.2f}ms min={metrics['min_ms']:.2f}ms "
        f"max={metrics['max_ms']:.2f}ms p95={metrics['p95_ms']:.2f}ms"
    )

    reasons = []
    if metrics["avg_ms"] > warn_avg_ms:
        reasons.append(
            f"average latency {metrics['avg_ms']:.2f}ms exceeded threshold {warn_avg_ms:.2f}ms"
        )
    if metrics["p95_ms"] > warn_p95_ms:
        reasons.append(
            f"p95 latency {metrics['p95_ms']:.2f}ms exceeded threshold {warn_p95_ms:.2f}ms"
        )

    detected = len(reasons) > 0
    throughput = iterations / (total_runtime_ms / 1000.0) if total_runtime_ms > 0 else 0.0

    print(
        f"  final_speed=total_runtime:{total_runtime_ms:.2f}ms, "
        f"throughput:{throughput:.2f} iterations/s"
    )
    return detected


async def main(args: argparse.Namespace) -> int:
    run_started = time.perf_counter()
    db = _MockDB()
    layer = FraudDetectionLayer(db=db)
    target = "app.pipelines.verification.stages.fraud.layer.get_fraud_model"
    org_id = str(db.org_id)

    cases: List[CaseResult] = []

    with patch(target, return_value=None):
        cases.append(
            await _run_case(
                "clean invoice should pass",
                layer,
                {
                    "organization_id": org_id,
                    "invoice_id": "65f000000000000000000999",
                    "invoice_data": _build_invoice("clean"),
                },
                lambda r: r.verdict.value in {"pass", "warn"} and r.score > 0.5,
            )
        )

        cases.append(
            await _run_case(
                "duplicate should be flagged",
                layer,
                {
                    "organization_id": org_id,
                    "invoice_id": "65f000000000000000000998",
                    "invoice_data": _build_invoice("duplicate"),
                },
                lambda r: any("DUPLICATE" in f for f in (r.flags or [])),
            )
        )

        cases.append(
            await _run_case(
                "unknown customer should be flagged",
                layer,
                {
                    "organization_id": org_id,
                    "invoice_id": "65f000000000000000000997",
                    "invoice_data": _build_invoice("unknown_customer"),
                },
                lambda r: any("CUSTOMER" in f for f in (r.flags or [])),
            )
        )

        cases.append(
            await _run_case(
                "missing organization id should fail",
                layer,
                {"invoice_id": "65f000000000000000000996", "invoice_data": _build_invoice("clean")},
                lambda r: r.verdict.value == "fail" and r.score == 0.0,
            )
        )

    benchmark = await _benchmark(iterations=args.iterations, delay_ms=args.delay_ms)
    total_runtime_ms = (time.perf_counter() - run_started) * 1000

    print("\nFraud layer checks:")
    for case in cases:
        _print_case(case)

    _print_bottleneck_scan(
        benchmark,
        total_runtime_ms=total_runtime_ms,
        iterations=args.iterations,
        warn_avg_ms=args.warn_avg_ms,
        warn_p95_ms=args.warn_p95_ms,
    )

    failed = [c for c in cases if not c.passed]
    print(f"\nSummary: {len(cases) - len(failed)}/{len(cases)} checks passed")
    return 1 if failed else 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--iterations", type=int, default=1)
    parser.add_argument("--delay-ms", type=float, default=40.0)
    parser.add_argument("--warn-avg-ms", type=float, default=40.0)
    parser.add_argument("--warn-p95-ms", type=float, default=100.0)
    raise SystemExit(asyncio.run(main(parser.parse_args())))
