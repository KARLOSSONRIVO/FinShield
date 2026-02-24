"""
System bottleneck scanner for FinShield.

This script runs quick micro-benchmarks for:
1. Anomaly detection layer
2. Fraud detection layer
3. Optional API endpoint load test

Run examples:
  python TESTS/test_bottleneck_scan.py
  python TESTS/test_bottleneck_scan.py --api-url http://localhost:5000/health --concurrency 10 --requests 100
"""

import argparse
import asyncio
import concurrent.futures
import os
import re
import statistics
import sys
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from unittest.mock import patch
import importlib.util
import types

import requests
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
from app.pipelines.verification.stages.fraud.layer import FraudDetectionLayer  # noqa: E402


class _MockInvoicesAnomaly:
    def find_one(self, *_args, **_kwargs):
        return None


class _MockDBAnomaly:
    def __init__(self):
        self.invoices = _MockInvoicesAnomaly()


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
                    flags = re.IGNORECASE if "i" in expected.get("$options", "") else 0
                    if value is None or re.search(expected["$regex"], str(value), flags) is None:
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


class _MockDBFraud:
    def __init__(self):
        org_id = ObjectId("65f000000000000000000001")
        self.org_id = org_id
        self.invoices = _Collection(
            [
                {
                    "_id": ObjectId("65f000000000000000000201"),
                    "orgId": org_id,
                    "invoiceNumber": "INV-101",
                    "issuedTo": "Acme Corp",
                    "fileHashSha256": "f" * 64,
                    "totalAmount": 1200.0,
                    "invoiceDate": "2026-02-10",
                    "createdAt": datetime.now(timezone.utc) - timedelta(days=2),
                    "reviewDecision": "approved",
                }
            ]
        )
        self.organizations = _Collection([{"_id": org_id, "approvedCustomers": ["Acme Corp"]}])


class _FakeIsoModel:
    def decision_function(self, _rows):
        return [0.3]


def _anomaly_context() -> Dict[str, Any]:
    return {
        "organization_id": "org_bench_001",
        "invoice_data": {
            "invoiceNumber": "2026501",
            "invoiceDate": "2026-02-15",
            "totalAmount": 1250.75,
            "subtotal": 1120.32,
            "tax": 130.43,
            "issuedTo": "Acme Corp",
            "lineItems": [
                {"description": "A", "qty": 1, "unitPrice": 850.0, "amount": 850.0},
                {"description": "B", "qty": 1, "unitPrice": 270.32, "amount": 270.32},
            ],
        },
        "raw_text": "Invoice Number 2026501\nTotal 1250.75",
    }


def _fraud_context(org_id: str) -> Dict[str, Any]:
    return {
        "organization_id": org_id,
        "invoice_id": "65f000000000000000000999",
        "invoice_data": {
            "invoiceNumber": "INV-3001",
            "invoiceDate": "2026-02-20",
            "totalAmount": 1325.55,
            "subtotal": 1200.0,
            "tax": 125.55,
            "issuedTo": "Acme Corp",
            "lineItems": [{"description": "Service", "qty": 1, "unitPrice": 1200.0, "amount": 1200.0}],
            "fileHashSha256": "a" * 64,
            "createdAt": datetime.now(timezone.utc).isoformat(),
        },
    }


def _calc_latency_stats(latencies_ms: List[float]) -> Dict[str, float]:
    latencies_ms.sort()
    avg = statistics.mean(latencies_ms)
    p95 = latencies_ms[min(len(latencies_ms) - 1, int(len(latencies_ms) * 0.95))]
    return {
        "avg_ms": avg,
        "min_ms": latencies_ms[0],
        "max_ms": latencies_ms[-1],
        "p95_ms": p95,
    }


async def _benchmark_anomaly(iterations: int) -> Dict[str, float]:
    layer = AnomalyDetectionLayer(db=_MockDBAnomaly())
    latencies = []
    target = "app.pipelines.verification.stages.anomaly.layer.get_model_from_s3"
    with patch(target, return_value=_FakeIsoModel()):
        for _ in range(iterations):
            started = time.perf_counter()
            await layer.analyze(_anomaly_context())
            latencies.append((time.perf_counter() - started) * 1000)
    return _calc_latency_stats(latencies)


async def _benchmark_fraud(iterations: int) -> Dict[str, float]:
    db = _MockDBFraud()
    layer = FraudDetectionLayer(db=db)
    latencies = []
    target = "app.pipelines.verification.stages.fraud.layer.get_fraud_model"
    with patch(target, return_value=None):
        for _ in range(iterations):
            started = time.perf_counter()
            await layer.analyze(_fraud_context(str(db.org_id)))
            latencies.append((time.perf_counter() - started) * 1000)
    return _calc_latency_stats(latencies)


def _single_api_call(url: str, method: str, timeout: int, token: Optional[str]) -> float:
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    started = time.perf_counter()
    requests.request(method, url, timeout=timeout, headers=headers)
    return (time.perf_counter() - started) * 1000


def _benchmark_api(url: str, method: str, requests_count: int, concurrency: int, timeout: int, token: Optional[str]):
    latencies = []
    failures = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as pool:
        futures = [
            pool.submit(_single_api_call, url, method, timeout, token) for _ in range(requests_count)
        ]
        for future in concurrent.futures.as_completed(futures):
            try:
                latencies.append(future.result())
            except Exception:
                failures += 1
    if not latencies:
        return {"avg_ms": 0.0, "min_ms": 0.0, "max_ms": 0.0, "p95_ms": 0.0, "failures": failures}
    stats = _calc_latency_stats(latencies)
    stats["failures"] = failures
    return stats


def _print_stats(label: str, stats: Dict[str, float]) -> None:
    print(
        f"{label}: avg={stats['avg_ms']:.2f}ms min={stats['min_ms']:.2f}ms "
        f"max={stats['max_ms']:.2f}ms p95={stats['p95_ms']:.2f}ms"
    )


async def main(args: argparse.Namespace) -> int:
    print("Bottleneck scan started\n")

    anomaly_stats = await _benchmark_anomaly(args.iterations)
    fraud_stats = await _benchmark_fraud(args.iterations)

    _print_stats("Anomaly layer", anomaly_stats)
    _print_stats("Fraud layer", fraud_stats)

    warnings = []
    if anomaly_stats["avg_ms"] > args.anomaly_avg_warn_ms:
        warnings.append(
            f"Anomaly average latency {anomaly_stats['avg_ms']:.2f}ms exceeds {args.anomaly_avg_warn_ms:.2f}ms."
        )
    if anomaly_stats["p95_ms"] > args.anomaly_p95_warn_ms:
        warnings.append(
            f"Anomaly p95 latency {anomaly_stats['p95_ms']:.2f}ms exceeds {args.anomaly_p95_warn_ms:.2f}ms."
        )
    if fraud_stats["avg_ms"] > args.fraud_avg_warn_ms:
        warnings.append(
            f"Fraud average latency {fraud_stats['avg_ms']:.2f}ms exceeds {args.fraud_avg_warn_ms:.2f}ms."
        )
    if fraud_stats["p95_ms"] > args.fraud_p95_warn_ms:
        warnings.append(
            f"Fraud p95 latency {fraud_stats['p95_ms']:.2f}ms exceeds {args.fraud_p95_warn_ms:.2f}ms."
        )

    if args.api_url:
        api_stats = _benchmark_api(
            url=args.api_url,
            method=args.api_method,
            requests_count=args.requests,
            concurrency=args.concurrency,
            timeout=args.timeout,
            token=args.token,
        )
        _print_stats("API load test", api_stats)
        print(f"API failures: {api_stats['failures']}")

        if api_stats["avg_ms"] > args.api_avg_warn_ms:
            warnings.append(
                f"API average latency {api_stats['avg_ms']:.2f}ms exceeds {args.api_avg_warn_ms:.2f}ms."
            )
        if api_stats["p95_ms"] > args.api_p95_warn_ms:
            warnings.append(
                f"API p95 latency {api_stats['p95_ms']:.2f}ms exceeds {args.api_p95_warn_ms:.2f}ms."
            )
        if api_stats["failures"] > 0:
            warnings.append(f"API failures detected: {api_stats['failures']}")

    print("\nIdentified bottlenecks:")
    if not warnings:
        print("  None detected with current thresholds.")
        return 0

    for warning in warnings:
        print(f"  - {warning}")
    return 1


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run bottleneck scans for FinShield layers and APIs")
    parser.add_argument("--iterations", type=int, default=100, help="Iterations per layer benchmark")
    parser.add_argument("--api-url", help="Optional API URL for load testing")
    parser.add_argument("--api-method", default="GET", choices=["GET", "POST", "PUT", "PATCH", "DELETE"])
    parser.add_argument("--requests", type=int, default=50, help="Total API requests for load test")
    parser.add_argument("--concurrency", type=int, default=10, help="Concurrent workers for API load test")
    parser.add_argument("--timeout", type=int, default=30, help="API request timeout seconds")
    parser.add_argument("--token", help="Optional bearer token for API load test")
    parser.add_argument("--anomaly-avg-warn-ms", type=float, default=40.0)
    parser.add_argument("--anomaly-p95-warn-ms", type=float, default=100.0)
    parser.add_argument("--fraud-avg-warn-ms", type=float, default=60.0)
    parser.add_argument("--fraud-p95-warn-ms", type=float, default=150.0)
    parser.add_argument("--api-avg-warn-ms", type=float, default=2000.0)
    parser.add_argument("--api-p95-warn-ms", type=float, default=5000.0)
    parsed = parser.parse_args()

    raise SystemExit(asyncio.run(main(parsed)))
