"""
Background Scheduler for FinShield AI Service

Runs periodic tasks:
- Health check ping every 10 minutes (keeps service alive)
- Model training at 2 AM daily (optional, commented out by default)
"""
import os
import logging
import requests
from apscheduler.schedulers.background import BackgroundScheduler

logger = logging.getLogger(__name__)

# Global scheduler instance
scheduler = None


def health_check_ping():
    """Ping the health endpoint to keep service alive"""
    try:
        # Get service URL from environment or use localhost
        service_url = os.getenv("SERVICE_URL", "http://localhost:8000")
        response = requests.get(f"{service_url}/", timeout=5)
        
        if response.status_code == 200:
            logger.info(f"✓ Health check ping successful: {response.json()}")
        else:
            logger.warning(f"⚠ Health check returned status {response.status_code}")
            
    except Exception as e:
        logger.error(f"❌ Health check ping failed: {e}")


def train_models_job():
    """Run model training (runs at 2 AM daily)"""
    import subprocess
    
    try:
        logger.info("🚀 Starting scheduled model training...")
        result = subprocess.run(
            ["python", "scripts/train_models.py", "--all"],
            capture_output=True,
            text=True,
            timeout=3600  # 1 hour timeout
        )
        
        if result.returncode == 0:
            logger.info("✅ Model training completed successfully")
        else:
            logger.error(f"❌ Model training failed: {result.stderr}")
            
    except subprocess.TimeoutExpired:
        logger.error("❌ Model training timed out after 1 hour")
    except Exception as e:
        logger.error(f"❌ Model training error: {e}")


def start_scheduler():
    """Initialize and start the background scheduler"""
    global scheduler
    
    # Only start scheduler in the main worker process
    # Check if this is the main process (worker ID = 0 or not set)
    worker_id = os.getenv("WORKER_ID", "0")
    
    if worker_id != "0":
        logger.info(f"Skipping scheduler on worker {worker_id} (only runs on main worker)")
        return
    
    if scheduler is not None:
        logger.warning("Scheduler already running, skipping initialization")
        return
    
    logger.info("🕐 Initializing background scheduler...")
    
    scheduler = BackgroundScheduler()
    
    # Add health check job - every 10 minutes
    scheduler.add_job(
        health_check_ping,
        'interval',
        minutes=10,
        id='health_check',
        name='Health Check Ping (every 10 min)'
    )
    logger.info("  ✓ Health check job scheduled (every 10 minutes)")
    
    # Add model training job - daily at 2 AM
    scheduler.add_job(
        train_models_job,
        'cron',
        hour=2,
        minute=0,
        id='train_models',
        name='Model Training (daily at 2 AM)'
    )
    logger.info("  ✓ Model training job scheduled (daily at 2 AM)")
    
    # Start the scheduler
    scheduler.start()
    logger.info("✅ Scheduler started successfully")


def stop_scheduler():
    """Stop the background scheduler"""
    global scheduler
    
    if scheduler is not None:
        logger.info("🛑 Stopping scheduler...")
        scheduler.shutdown()
        scheduler = None
        logger.info("✅ Scheduler stopped")
