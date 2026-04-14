from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from datetime import date, datetime
import os
import logging
import pytz
from app.db.database import SessionLocal
from app.db.models import SalarySlipDispatchLog
from app.core.email_utils import send_email_with_attachment

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DispatchService:
    @staticmethod
    def run_daily_dispatch():
        """
        Main job to process monthly salary slip dispatches.
        Runs daily, but internal logic restricts processing to 5th-10th of the month.
        Targets salary slips of the previous month.
        """
        db: Session = SessionLocal()
        try:
            # Get current time in IST
            ist_tz = pytz.timezone('Asia/Kolkata')
            now_ist = datetime.now(ist_tz)
            day_of_month = now_ist.day

            # Requirement: ONLY proceed if day is between 5 and 10 (inclusive)
            if not (5 <= day_of_month <= 10):
                logger.info(f"Skipping dispatch: Day {day_of_month} is outside the 5th-10th window.")
                return

            # Calculate previous month and year
            if now_ist.month == 1:
                prev_month = 12
                prev_year = now_ist.year - 1
            else:
                prev_month = now_ist.month - 1
                prev_year = now_ist.year

            logger.info(f"Starting daily dispatch job for {now_ist.date()} (Targeting: {prev_month}/{prev_year})")

            # Process Monthly Slips
            logs = db.query(SalarySlipDispatchLog).filter(
                SalarySlipDispatchLog.document_type == "monthly",
                SalarySlipDispatchLog.status != "SENT",
                SalarySlipDispatchLog.month == prev_month,
                SalarySlipDispatchLog.year == prev_year
            ).all()
            
            for log in logs:
                DispatchService._send_log_email(db, log)

        except Exception as e:
            logger.error(f"Error in daily dispatch job: {str(e)}")
        finally:
            db.close()

    @staticmethod
    def _send_log_email(db: Session, log: SalarySlipDispatchLog):
        """
        Attempt to send email for a single log entry and update its status.
        """
        try:
            # Skip if file missing
            if not log.file_path or not os.path.exists(log.file_path):
                logger.warning(f"File path missing or invalid for log {log.id}: {log.file_path}")
                log.status = "FAILED"
                log.last_attempt_at = datetime.now()
                db.commit()
                return

            subject_period = f"{log.month}/{log.year}"
            
            send_email_with_attachment(
                to_email=log.email,
                subject=f"Salary Slip for {subject_period}",
                body=f"Hello,\n\nPlease find your {log.document_type} salary slip for {subject_period} attached.\n\nRegards,\nHR Team",
                file_path=log.file_path,
                file_name=os.path.basename(log.file_path)
            )

            # Success
            log.status = "SENT"
            log.sent_at = datetime.now()
            db.commit()
            logger.info(f"Successfully sent salary slip email to {log.email} (ID: {log.id})")

        except Exception as e:
            logger.error(f"Failed to send email for log {log.id} to {log.email}: {str(e)}")
            log.status = "FAILED"
            log.retry_count += 1
            log.last_attempt_at = datetime.now()
            db.commit()

def start_dispatch_scheduler():
    """
    Starts the BackgroundScheduler to run the dispatch job daily.
    """
    scheduler = BackgroundScheduler()
    # Runs daily at 8:00 AM IST
    scheduler.add_job(
        DispatchService.run_daily_dispatch, 
        'cron', 
        hour=8, 
        minute=0, 
        timezone=pytz.timezone('Asia/Kolkata')
    )
    scheduler.start()
    logger.info("Salary Slip Dispatch Scheduler started (Daily at 8:00 AM IST)")
