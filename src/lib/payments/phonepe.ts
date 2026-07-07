// PhonePe Payment Handler
// This module handles payment link generation via PhonePe as fallback method

export interface PhonePePaymentLinkRequest {
  orderId: number;
  customerId: number;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface PhonePePaymentResponse {
  paymentLinkId: string;
  paymentLink: string;
  orderId: number;
}

/**
 * Generate a PhonePe payment link for checkout as fallback payment method
 * This function communicates with backend payment handler to create payment links
 */
export async function generatePhonePePaymentLink(
  request: PhonePePaymentLinkRequest
): Promise<PhonePePaymentResponse> {
  try {
    const { generatePaymentLink } = await import('@/lib/api-handlers/checkout');
    
    const response = await generatePaymentLink({
      orderId: request.orderId,
      customerId: request.customerId,
      amount: request.amount,
      customerName: request.customerName,
      customerEmail: request.customerEmail,
      customerPhone: request.customerPhone,
      paymentMethod: 'phonepe',
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to generate PhonePe payment link');
    }

    return {
      paymentLinkId: response.paymentId,
      paymentLink: response.paymentLink,
      orderId: request.orderId,
    };
  } catch (error: any) {
    console.error('[v0] PhonePe payment link generation failed:', error);
    throw error;
  }
}

/**
 * Verify PhonePe payment status (called after payment completion)
 */
export async function verifyPhonePePayment(
  paymentId: string,
  orderId: number
): Promise<{ verified: boolean; status: string }> {
  try {
    const { verifyPayment } = await import('@/lib/api-handlers/checkout');
    return await verifyPayment(paymentId, orderId, 'phonepe');
  } catch (error: any) {
    console.error('[v0] PhonePe payment verification failed:', error);
    throw error;
  }
}
