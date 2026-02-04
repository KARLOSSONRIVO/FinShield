"""
Background Scheduler for FinShield AI Service

Runs periodic tasks:
- Health check ping every 10 minutes (keeps service alive)
- Anomaly model training every 3 days at 2 AM (catches high-activity orgs faster)
- Fraud model retraining monthly (1st of each month at 3 AM)
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


def train_anomaly_models_job():
    """Run anomaly model training (runs weekly on Sundays at 2 AM)"""
    import subprocess
    
    try:
        logger.info("🚀 Starting scheduled anomaly model training...")
        result = subprocess.run(
            ["python", "scripts/train_anomaly_models.py", "--all"],
            capture_output=True,
            text=True,
            timeout=3600  # 1 hour timeout
        )
        
        if result.returncode == 0:
            logger.info("✅ Anomaly model training completed successfully")
        else:
            logger.error(f"❌ Anomaly model training failed: {result.stderr}")
            
    except subprocess.TimeoutExpired:
        logger.error("❌ Anomaly model training timed out after 1 hour")
    except Exception as e:
        logger.error(f"❌ Anomaly model training error: {e}")


def train_fraud_model_job():
    """Run fraud model retraining (runs monthly on the 1st at 3 AM)"""
    import subprocess
    
    try:
        logger.info("🚀 Starting scheduled fraud model retraining...")
        result = subprocess.run(
            ["python", "scripts/train_fraud_model.py"],
            capture_output=True,
            text=True,
            timeout=7200  # 2 hour timeout (larger dataset)
        )
        
        if result.returncode == 0:
            logger.info("✅ Fraud model retraining completed successfully")
            logger.info(f"Output: {result.stdout[-500:] if len(result.stdout) > 500 else result.stdout}")
        else:
            logger.error(f"❌ Fraud model retraining failed: {result.stderr}")
            
    except subprocess.TimeoutExpired:
        logger.error("❌ Fraud model retraining timed out after 2 hours")
    except Exception as e:
        logger.error(f"❌ Fraud model retraining error: {e}")


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
    
    # Add anomaly model training job - every 3 days at 2 AM
    # This allows high-activity orgs (400+ invoices) to retrain faster
    # while still ensuring low-activity orgs retrain at least weekly
    scheduler.add_job(
        train_anomaly_models_job,
        'interval',
        days=3,
        start_date='2026-02-04 02:00:00',  # Start at 2 AM
        id='train_anomaly_models',
        name='Anomaly Model Training (every 3 days at 2 AM)'
    )
    logger.info("  ✓ Anomaly model training job scheduled (every 3 days at 2 AM)")
    
    # Add fraud model retraining job - monthly on the 1st at 3 AM
    scheduler.add_job(
        train_fraud_model_job,
        'cron',
        day=1,
        hour=3,
        minute=0,
        id='train_fraud_model',
        name='Fraud Model Retraining (monthly on 1st at 3 AM)'
    )
    logger.info("  ✓ Fraud model retraining job scheduled (monthly on 1st at 3 AM)")
    
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
