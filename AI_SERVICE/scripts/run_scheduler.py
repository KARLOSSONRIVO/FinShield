"""
Standalone Training Scheduler Process

This script runs the training scheduler as a separate process from the API workers.
It should be deployed and run independently.

Usage:
    python scripts/run_scheduler.py
"""
import sys
import os
import signal
import time
from dotenv import load_dotenv

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables
load_dotenv()

from scripts.scheduler import start_scheduler, stop_scheduler

def signal_handler(signum, frame):
    """Handle shutdown signals gracefully"""
    print("\n🛑 Received shutdown signal, stopping scheduler...")
    stop_scheduler()
    sys.exit(0)

if __name__ == "__main__":
    print("=" * 60)
    print("🕐 FinShield AI Service - Training Scheduler")
    print("=" * 60)
    print("Starting background scheduler for model training...")
    print("  - Anomaly models: Check every 3 days")
    print("  - Fraud model: Monthly (1st of month at 2 AM)")
    print("=" * 60)
    
    # Register signal handlers for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Start the scheduler
    start_scheduler()
    print("✅ Scheduler started successfully")
    print("Press Ctrl+C to stop...\n")
    
    # Keep the process running
    try:
        while True:
            time.sleep(1)
    except (KeyboardInterrupt, SystemExit):
        print("\n🛑 Shutting down scheduler...")
        stop_scheduler()
