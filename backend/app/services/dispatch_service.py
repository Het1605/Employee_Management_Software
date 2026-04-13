from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from datetime import date, datetime
import os
import logging
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
        Main job to process both monthly and yearly salary slip dispatches.
        """
        db: Session = SessionLocal()
        try:
            today = date.today()
            day_of_month = today.day
            
            # Configuration
            MONTHLY_SEND_DAY = 5
            YEARLY_SEND_DAY = 5

            logger.info(f"Starting daily dispatch job for {today}")

            # 1. Process Monthly Slips
            if day_of_month >= MONTHLY_SEND_DAY:
                logger.info(f"Processing all pending monthly slips prior to {today.month}/{today.year}")
                
                logs = db.query(SalarySlipDispatchLog).filter(
                    SalarySlipDispatchLog.document_type == "monthly",
                    SalarySlipDispatchLog.status != "SENT",
                    or_(
                        SalarySlipDispatchLog.year < today.year,
                        and_(
                            SalarySlipDispatchLog.year == today.year,
                            SalarySlipDispatchLog.month < today.month
                        )
                    )
                ).all()
                
                for log in logs:
                    DispatchService._send_log_email(db, log)

            # 2. Process Yearly Slips
            if day_of_month >= YEARLY_SEND_DAY:
                logger.info(f"Processing all pending yearly slips prior to {today.year}")

                logs = db.query(SalarySlipDispatchLog).filter(
                    SalarySlipDispatchLog.document_type == "yearly",
                    SalarySlipDispatchLog.status != "SENT",
                    SalarySlipDispatchLog.year < today.year
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

            subject_period = f"{log.month}/{log.year}" if log.document_type == "monthly" else f"{log.year}"
            
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
    # Runs daily at 9:00 AM
    scheduler.add_job(DispatchService.run_daily_dispatch, 'cron', hour=9, minute=0)
    scheduler.start()
    logger.info("Salary Slip Dispatch Scheduler started (Daily at 9:00 AM)")
