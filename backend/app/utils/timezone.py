from datetime import datetime
import pytz

IST = pytz.timezone("Asia/Kolkata")

def utc_to_ist(dt: datetime) -> datetime:
    """
    Convert datetime to IST timezone and format without timezone info
    """
    if dt.tzinfo is None:
        # If naive datetime, assume it's already in IST
        return dt.isoformat()
    
    # Convert to IST
    ist_time = dt.astimezone(IST)
    return ist_time.isoformat()

def utc_to_ist_formatted(dt: datetime) -> str:
    """
    Convert datetime to IST and return formatted string
    """
    if dt.tzinfo is None:
        # If naive datetime, assume it's already in IST
        return dt.strftime("%Y-%m-%dT%H:%M:%S+05:30")
    
    # Convert to IST
    ist_time = dt.astimezone(IST)
    return ist_time.strftime("%Y-%m-%dT%H:%M:%S+05:30")