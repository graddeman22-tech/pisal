# Payment Integration & Profile Photo Upload - Setup Guide

This document provides comprehensive setup instructions for the two implemented features:
1. **Profile Photo Upload** - Using Supabase Storage
2. **Payment Integration** - Razorpay + PhonePe with dynamic payment links

---

## Feature 1: Profile Photo Upload

### Overview
Users can now upload profile photos with the following features:
- **Camera icon overlay** on the avatar for easy access
- **File validation** (size limit: 5MB, supported types: JPG, PNG, WebP, GIF)
- **Supabase Storage integration** for secure file uploads
- **Automatic avatar URL storage** in user profile

### Setup Steps

#### 1. Supabase Storage Bucket Setup
```bash
# Create 'profiles' bucket in Supabase
1. Go to Supabase Dashboard → Storage
2. Click "New bucket" and name it 'profiles'
3. Set visibility to "Public" (to generate public URLs)
4. Click "Create bucket"
```

#### 2. Enable Row Level Security (Optional but Recommended)
```sql
-- In Supabase SQL Editor, run:
ALTER POLICY "Enable read access for all users" ON storage.objects
FOR SELECT USING (bucket_id = 'profiles');

ALTER POLICY "Enable insert for authenticated users only" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profiles' 
  AND auth.role() = 'authenticated'
);

ALTER POLICY "Enable delete for users based on user_id" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profiles' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### 3. Database Schema Update
The `users` table now includes an `avatar_url` column:
```sql
ALTER TABLE users ADD COLUMN avatar_url TEXT;
```
*(This is auto-migrated by Drizzle ORM via the updated schema)*

#### 4. How It Works
1. User clicks the **camera icon** on their profile avatar
2. File selection dialog appears
3. File is validated (type & size)
4. File is uploaded to Supabase Storage (`profiles/avatars/...`)
5. Public URL is generated
6. User profile is updated with the new avatar URL
7. Avatar displays immediately in the UI

### Frontend Implementation
- **Component**: `/src/pages/profile.tsx`
- **Storage client**: `/src/lib/supabase.ts`
- **Upload handler**: `handleAvatarUpload()` function with validation

---

## Feature 2: Payment Integration (Razorpay + PhonePe)

### Overview
Comprehensive payment system with:
- **Primary payment gateway**: Razorpay (cards, UPI, netbanking)
- **Fallback payment gateway**: PhonePe (UPI, cards)
- **Payment method options**: UPI, Razorpay (cards/net banking), COD
- **Secure payment link generation** with order tracking
- **Success confirmation modal** with order details
- **Order status persistence** in Supabase database

### Setup Steps

#### 1. Environment Variables
Set these in your `.env` or Vercel environment:

```env
# Razorpay (Get from https://dashboard.razorpay.com/settings/api-keys)
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
VITE_RAZORPAY_KEY_SECRET=your_razorpay_secret_key

# PhonePe (Get from https://developer.phonepe.com/)
VITE_PHONEPE_MERCHANT_ID=your_phonepe_merchant_id
VITE_PHONEPE_SALT_KEY=your_phonepe_salt_key
VITE_PHONEPE_SANDBOX_URL=https://api-sandbox.phonepe.com
VITE_PHONEPE_LIVE_URL=https://api.phonepe.com

# Supabase (Already configured)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### 2. Database Schema Updates
The `orders` table now includes payment-related fields:
```sql
ALTER TABLE orders ADD COLUMN payment_id TEXT;
ALTER TABLE orders ADD COLUMN payment_link TEXT;

-- Already exists:
-- payment_status (pending, completed, failed)
-- payment_method (razorpay, phonepe, upi, cod)
```

#### 3. Payment Link Generation
The system now generates secure payment links:

**For Razorpay**:
- Link Format: `https://rzp.io/l/{paymentLink}`
- Stored in: `orders.payment_link`
- Payment ID: `orders.payment_id`

**For PhonePe**:
- Link Format: `https://phonepe.com/pay/{merchantTransactionId}`
- Stored in: `orders.payment_link`
- Transaction ID: `orders.payment_id`

#### 4. Checkout Flow

```
User Cart → Address Selection → Payment Method Selection
    ↓
[Place Order Button]
    ↓
Create Order in DB (status: pending)
    ↓
Generate Payment Link (via backend)
    ↓
Open Payment Link (new tab/window)
    ↓
Customer Completes Payment
    ↓
Success Modal (shows Order ID)
    ↓
Redirect to Home
```

### Implementation Details

#### Frontend Components
- **Checkout Page**: `/src/pages/checkout.tsx`
  - Address selection
  - Payment method selector
  - Success modal integration
  
- **Success Modal**: `/src/components/SuccessModal.tsx`
  - Shows order confirmation
  - Auto-closes after 8 seconds (configurable)
  - Order ID display
  - Continue shopping button

- **Payment Handlers**: `/src/lib/payments/`
  - `razorpay.ts` - Razorpay payment logic
  - `phonepe.ts` - PhonePe payment logic

#### Backend Handler
- **Location**: `/src/lib/api-handlers/checkout.ts`
- **Functions**:
  - `generatePaymentLink()` - Routes to payment gateway
  - `verifyPayment()` - Verifies payment completion
  - Payment method routing logic

### Payment Methods

#### 1. **UPI (PhonePe Fallback)**
- Available for all users
- Opens PhonePe payment link
- Instant payment confirmation

#### 2. **Razorpay (Cards & Netbanking)**
- Supports Visa, Mastercard, Amex
- Netbanking for all major banks
- E-wallet options
- Opens in new window

#### 3. **COD (Cash on Delivery)**
- No payment link generation
- Order confirmed immediately
- Success modal shows without payment

### Integration with Production Backends

To connect to actual Razorpay/PhonePe APIs:

#### 1. **Razorpay Integration**
```typescript
// In your backend (Node.js/Express example):
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.post('/api/payments/razorpay', async (req, res) => {
  try {
    const { amount, orderId, customerName, customerEmail } = req.body;
    
    const paymentLink = await razorpay.paymentLink.create({
      amount: amount * 100, // Razorpay expects paise
      currency: 'INR',
      accept_partial: false,
      reference_id: `ORDER_${orderId}`,
      description: `Order #${orderId}`,
      customer_notify: 1,
      notify: { sms: true, email: true },
      notes: { orderId },
    });

    res.json({
      success: true,
      paymentId: paymentLink.id,
      paymentLink: paymentLink.short_url,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

#### 2. **PhonePe Integration**
```typescript
// In your backend:
import crypto from 'crypto';
import axios from 'axios';

app.post('/api/payments/phonepe', async (req, res) => {
  try {
    const { amount, orderId, customerPhone } = req.body;
    const merchantTransactionId = `MERCHANT_${orderId}_${Date.now()}`;
    
    const payload = {
      merchantId: process.env.PHONEPE_MERCHANT_ID,
      merchantTransactionId,
      merchantUserId: `USER_${orderId}`,
      amount: amount * 100,
      redirectUrl: `${process.env.APP_URL}/payment/callback`,
      callbackUrl: `${process.env.APP_URL}/api/payments/phonepe/callback`,
      mobileNumber: customerPhone,
      paymentInstrument: { type: 'PAYPAGE' },
    };

    const base64String = Buffer.from(JSON.stringify(payload)).toString('base64');
    const saltIndex = 1;
    const checksum = crypto
      .createHash('sha256')
      .update(base64String + '/pg/v1/pay' + process.env.PHONEPE_SALT_KEY)
      .digest('hex');

    const response = await axios.post(
      `${process.env.PHONEPE_SANDBOX_URL}/pg/v1/pay`,
      { request: base64String },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': `${checksum}###${saltIndex}`,
        },
      }
    );

    res.json({
      success: true,
      paymentId: merchantTransactionId,
      paymentLink: response.data.data.instrumentResponse.redirectInfo.url,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

### Testing

#### Sandbox Credentials
- **Razorpay Sandbox**: Use test keys from dashboard
- **PhonePe Sandbox**: Test mode enabled by default

#### Test Cards
```
Razorpay Test Cards:
- Success: 4111 1111 1111 1111
- Failure: 4222 2222 2222 2222

PhonePe Test:
- All transactions succeed in sandbox mode
```

### Troubleshooting

#### Payment Link Not Generated
1. Check environment variables are set
2. Verify Supabase orders table schema
3. Check browser console for errors
4. Verify payment gateway credentials

#### Avatar Upload Fails
1. Check Supabase bucket 'profiles' exists and is public
2. Verify user has storage permissions
3. Check file size < 5MB
4. Check file type is valid image format

#### Orders Not Updating
1. Verify Supabase RLS policies allow updates
2. Check user_id matches authenticated user
3. Verify payment_id and payment_link columns exist

---

## Database Migrations

### For Drizzle ORM
```bash
# Push schema changes to database
pnpm db:push

# View database in Drizzle Studio
pnpm db:studio
```

### Manual SQL (if needed)
```sql
-- Add avatar_url to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add payment fields to orders
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS payment_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_link TEXT;
```

---

## Files Modified/Created

### Modified Files
- `/lib/db/src/schema/users.ts` - Added `avatarUrl` field
- `/lib/db/src/schema/orders.ts` - Added payment fields
- `/src/pages/profile.tsx` - Enhanced avatar upload with validation
- `/src/pages/checkout.tsx` - Integrated payment flow

### New Files Created
- `/src/lib/payments/razorpay.ts` - Razorpay payment handler
- `/src/lib/payments/phonepe.ts` - PhonePe payment handler
- `/src/lib/api-handlers/checkout.ts` - Payment link generation logic
- `/src/components/SuccessModal.tsx` - Success confirmation component

---

## Security Considerations

1. **File Upload**
   - Validate file type on frontend and backend
   - Enforce file size limits (5MB)
   - Use secure Supabase storage with RLS

2. **Payment Links**
   - Generate links server-side only (never client-side)
   - Store payment IDs for verification
   - Implement webhook handlers for payment confirmation
   - Validate payment signatures before confirming orders

3. **API Keys**
   - Never expose secret keys (use backend only)
   - Rotate keys regularly
   - Use environment variables for all credentials

---

## Next Steps for Production

1. **Implement Backend API Endpoints**
   - Replace mock handlers with actual Razorpay/PhonePe SDK calls
   - Add webhook handlers for payment confirmations
   - Implement payment verification

2. **Add Webhook Handlers**
   - Razorpay: Update order status on payment confirmation
   - PhonePe: Verify transaction status via callback

3. **Error Handling**
   - Add retry logic for failed payments
   - Implement payment refunds
   - Log all payment events

4. **Testing**
   - Test all payment methods
   - Verify avatar uploads
   - Test error scenarios
   - Load testing for payment links

5. **Monitoring**
   - Set up error logging (Sentry, LogRocket)
   - Monitor payment success rates
   - Track upload failures

---

## Support & Documentation

- **Razorpay Docs**: https://razorpay.com/docs/
- **PhonePe Docs**: https://developer.phonepe.com/
- **Supabase Storage**: https://supabase.com/docs/guides/storage
- **Drizzle ORM**: https://orm.drizzle.team/

---

## Rollback Instructions

If you need to disable these features:

### Disable Avatar Upload
- Remove Camera icon from profile component
- Remove handleAvatarUpload function
- Keep avatar_url column (won't hurt)

### Disable Payment Integration
- Remove payment gateway selection from checkout
- Show COD as only option
- Keep payment fields in database (for order history)

---

**Last Updated**: July 7, 2026  
**Features**: Profile Photo Upload, Razorpay + PhonePe Integration
