import os
from fastapi import APIRouter
from pydantic import BaseModel
from twilio.rest import Client

router = APIRouter()

TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.environ.get("TWILIO_PHONE_NUMBER", "whatsapp:+14155238886") # Default Twilio Sandbox Number

class SMSRequest(BaseModel):
    message: str
    target_number: str

@router.post("/send-sms")
def send_sms(req: SMSRequest):
    try:
        if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
            raise ValueError("Twilio credentials are not set in environment variables. Please define TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.")
        
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        
        message = client.messages.create(
            body=req.message,
            from_=TWILIO_PHONE_NUMBER,
            to=f"whatsapp:{req.target_number}"
        )
        return {"status": "success", "message_sid": message.sid}
    except Exception as e:
        return {"status": "error", "error": str(e)}
