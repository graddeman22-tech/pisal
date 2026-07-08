// Razorpay Payment Handler
// This module handles secure payment link generation using Razorpay API

export interface RazorpayPaymentLinkRequest {
  orderId: number;
  customerId: number;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface RazorpayPaymentResponse {
  paymentLinkId: string;
  paymentLink: string;
  orderId: number;
}

/**
 * Generate a Razorpay payment link for secure checkout
 * This function communicates with backend payment handler to create payment links
 */
export async function generateRazorpayPaymentLink(
  request: RazorpayPaymentLinkRequest
): Promise<RazorpayPaymentResponse> {
  try {
    // Import handler dynamically to avoid circular dependencies
    const { generatePaymentLink } = await import('@/lib/api-handlers/checkout');
    
    const response = await generatePaymentLink({
      orderId: request.orderId,
      customerId: request.customerId,
      amount: request.amount,
      customerName: request.customerName,
      customerEmail: request.customerEmail,
      customerPhone: request.customerPhone,
      paymentMethod: 'razorpay',
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to generate Razorpay payment link');
    }

    return {
      paymentLinkId: response.paymentId,
      paymentLink: response.paymentLink,
      orderId: request.orderId,
    };
  } catch (error: any) {
    console.error('[v0] Razorpay payment link generation failed:', error);
    throw error;
  }
}

/**
 * Verify Razorpay payment signature (called after payment completion)
 */
export async function verifyRazorpayPayment(
  paymentId: string,
  orderId: number
): Promise<{ verified: boolean; status: string }> {
  try {
    const { verifyPayment } = await import('@/lib/api-handlers/checkout');
    return await verifyPayment(paymentId, orderId, 'razorpay');
  } catch (error: any) {
    console.error('[v0] Razorpay payment verification failed:', error);
    throw error;
  }
}
