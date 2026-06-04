from pydantic import BaseModel

class PaymentProcess(BaseModel):
    order_id: int
    payment_method: str = "CARD"

class PaymentResponse(BaseModel):
    success: bool
    transaction_id: str
    status: str
    message: str