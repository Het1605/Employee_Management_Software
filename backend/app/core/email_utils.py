import smtplib
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from app.core.config import settings

def send_email_with_attachment(to_email: str, subject: str, body: str, file_path: str, file_name: str):
    """
    Core utility to send an email with a PDF attachment using SMTP.
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        raise ValueError("SMTP credentials are not configured")

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Attachment file not found: {file_path}")

    message = MIMEMultipart()
    message["From"] = settings.SMTP_USER
    message["To"] = to_email
    message["Subject"] = subject
    
    message.attach(MIMEText(body, "plain"))

    with open(file_path, "rb") as f:
        mime_part = MIMEBase("application", "pdf")
        mime_part.set_payload(f.read())
        encoders.encode_base64(mime_part)
        mime_part.add_header("Content-Disposition", f'attachment; filename="{file_name}"')
        message.attach(mime_part)

    server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
    server.starttls()
    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
    server.send_message(message)
    server.quit()
