# Concurrent Upload Flow (Current AI Service)

This document explains how the AI service behaves when many invoices are processed concurrently.

## Scope
This file focuses on AI_SERVICE behavior after the backend triggers OCR processing for anchored invoices.

## High-Level Flow
1. Backend anchors invoice and triggers AI OCR endpoint.
2. AI service receives `POST /ocr/{invoice_id}` requests concurrently.
3. For each request, AI service:
   - fetches invoice metadata from MongoDB
   - resolves CID from blockchain receipt
   - downloads invoice file from IPFS gateway
   - extracts OCR text and layout
   - runs agent-orchestrated verification tools
   - updates invoice risk fields in MongoDB
   - publishes completion event over Redis Pub/Sub

## Concurrency Model
### API concurrency
- FastAPI handles concurrent requests asynchronously.
- Multiple workers can process independent invoice requests at the same time.

### CPU and external bottlenecks
- OCR extraction is CPU intensive.
- IPFS downloads and blockchain receipt fetches are network bound.
- MongoDB updates are independent and run per invoice.

### Agent orchestration
- Verification is coordinated by `app/agent/orchestrator.py`.
- The orchestrator calls all three tools: layout, anomaly, fraud.
- Final score and verdict follow policy in `app/agent/prompt.py`.

## Cache Behavior Under Load
### Template cache
- Key pattern: `org:template:{org_id}`.
- First request per org is cache miss and loads from MongoDB.
- Subsequent requests for the same org use Redis cache until TTL expiry.

### Model cache
- Shared Redis binary cache is checked first for models.
- Local in-process cache is fallback.
- S3 is only used on cache miss.
- This reduces duplicate downloads across workers.

## Event Propagation
After OCR completion, AI publishes an event to Redis channel `channel:invoice`.
Node backend subscribers can fan out this event to clients.

## Scheduler Separation
- Scheduler is started by `scripts/run_scheduler.py` as a separate process.
- This avoids duplicate scheduled jobs across API workers.
- Scheduled jobs in `scripts/scheduler.py`:
  - health ping every 10 minutes
  - anomaly retraining every 3 days
  - fraud retraining monthly

## Operational Notes
- Keep Redis available for best cache hit rates and cross-worker sharing.
- Tune worker count based on CPU and OCR throughput.
- Monitor external dependencies:
  - IPFS gateway latency
  - blockchain RPC latency
  - S3 model fetch latency

## Change Note (March 2026)
This document replaces older flow notes that referenced the previous pipeline-runner and legacy backend queue assumptions.
