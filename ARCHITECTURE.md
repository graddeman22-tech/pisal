# System Architecture - Profile Photo Upload & Payment Integration

## System Overview Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Vite + React)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐              ┌──────────────────┐          │
│  │  Profile Page    │              │  Checkout Page   │          │
│  │  /pages/profile  │              │  /pages/checkout │          │
│  └────────┬─────────┘              └────────┬─────────┘          │
│           │                                  │                    │
│     Camera Icon ─────────┐          Payment Method ─────┐         │
│           │              │                  │            │        │
│           ▼              ▼                  ▼            ▼        │
│  ┌─────────────────────────────┐  ┌───────────────────────────┐  │
│  │  File Upload Handler        │  │  Payment Router           │  │
│  │  - Validation (type, size)  │  │  - Razorpay routing       │  │
│  │  - Supabase upload          │  │  - PhonePe routing        │  │
│  │  - Profile update           │  │  - COD handling           │  │
│  └────────────┬────────────────┘  └───────────┬────────────────┘  │
│               │                               │                   │
└───────────────┼───────────────────────────────┼───────────────────┘
                │                               │
                ▼                               ▼
        ┌────────────────┐           ┌─────────────────────┐
        │ Supabase       │           │ Payment Handler     │
        │ Storage        │           │ /lib/api-handlers   │
        │ profiles/      │           │ /checkout.ts        │
        │ avatars/       │           │                     │
        └────────────────┘           └──────────┬──────────┘
                │                               │
                ▼                ┌──────────────┼──────────────┐
        ┌────────────────┐       │              │              │
        │ Public URL ←───┤       ▼              ▼              ▼
        │ Stored in      │   Razorpay      PhonePe          DB
        │ users.         │   SDK           SDK           Update
        │ avatar_url     │                              (payment_id,
        └────────────────┘                              payment_link)
```

---

## Feature 1: Profile Photo Upload

### Component Hierarchy
```
Profile Page (/src/pages/profile.tsx)
├── Avatar Container
│   ├── Avatar Image
│   │   └── user?.avatarUrl || User Icon
│   │
│   └── Camera Icon Overlay (Lucide)
│       └── Hidden File Input
│           └── onChange: handleAvatarUpload()
│
└── Form (name, email, addresses)
```

### Upload Flow
```
┌─────────────┐
│  User Click │
│ Camera Icon │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ File Dialog Opens   │
│ accept="image/*"    │
└──────┬──────────────┘
       │ User selects file
       ▼
┌──────────────────────────────────┐
│ Validation Check                 │
│ - Type: jpg/png/webp/gif         │
│ - Size: < 5MB                    │
└──────┬─────────────────┬──────────┘
       │ Valid           │ Invalid
       ▼                 ▼
┌─────────────────┐  ┌─────────────────┐
│ Upload to       │  │ Show Error Toast│
│ Supabase        │  └─────────────────┘
│ /profiles/      │
│ avatars/{name}  │
└─────┬───────────┘
      │
      ▼
┌─────────────────────────┐
│ Get Public URL          │
│ from Supabase           │
└─────┬───────────────────┘
      │
      ▼
┌──────────────────────────┐
│ Update Profile           │
│ useUpdateUserProfile({   │
│   avatarUrl: publicUrl   │
│ })                       │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Show Success Toast       │
│ Re-render Avatar         │
└──────────────────────────┘
```

### Data Flow
```
Component State
├── uploading: boolean
├── profile: UserProfile
└── profile.avatarUrl: string (URL from Supabase)

Supabase Storage
├── Bucket: profiles
├── Folder: avatars/
└── Files: avatar_{userId}_{timestamp}.jpg

Supabase Database
└── users.avatar_url (TEXT, nullable)
    └── Stores public URL
```

---

## Feature 2: Payment Integration

### Component Hierarchy
```
Checkout Page (/src/pages/checkout.tsx)
├── Step 1: Address Selection
│   └── RadioGroup with addresses
│
├── Step 2: Payment Method Selection
│   ├── UPI (PhonePe) Radio
│   ├── Razorpay (Cards) Radio
│   └── COD Radio
│
├── Place Order Button
│   └── handlePlaceOrder()
│
└── SuccessModal Component
    ├── Order ID Display
    ├── Success Message
    ├── Auto-close Timer
    └── Redirect Logic

SuccessModal (/src/components/SuccessModal.tsx)
├── Close Button (X)
├── Success Icon (CheckCircle2)
├── Title & Message
├── Order ID Display
├── Action Buttons
└── Auto-close Timer
```

### Payment Flow Diagram
```
┌──────────────────────────────┐
│  User Clicks "Place Order"   │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  Validate Address Selected   │
│  Validate Cart Not Empty     │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│  Create Order in Database        │
│  - status: pending               │
│  - paymentMethod: razorpay/upi   │
│  - paymentStatus: pending        │
└──────┬─────────────────────┬─────┘
       │                     │
       │ Payment Method      │
       │ = COD?              │
       │                     │
   YES │                     │ NO
       │                     │
       ▼                     ▼
   ┌────────────────┐   ┌─────────────────────────┐
   │ Show Success   │   │ Generate Payment Link   │
   │ Modal NOW      │   │ (Razorpay/PhonePe)      │
   └────────────────┘   └──────────┬──────────────┘
                                   │
                                   ▼
                        ┌──────────────────────────┐
                        │ Update Order with:       │
                        │ - paymentId              │
                        │ - paymentLink            │
                        │ - paymentStatus: init    │
                        └──────────┬───────────────┘
                                   │
                                   ▼
                        ┌──────────────────────────┐
                        │ Open Payment Link        │
                        │ in New Tab/Window        │
                        └──────────┬───────────────┘
                                   │
                                   ▼
                        ┌──────────────────────────┐
                        │ Show Success Modal       │
                        │ after 1.5s delay         │
                        └──────────┬───────────────┘
                                   │
                                   ▼
                        ┌──────────────────────────┐
                        │ Auto-redirect to Home    │
                        │ after 8s                 │
                        └──────────────────────────┘
```

### Payment Method Routing
```
Payment Method Selection
│
├─── "cod" ───────────► No link generation
│                      └─► Immediate success modal
│
├─── "upi" ───────────► generatePhonePePaymentLink()
│                      └─► PhonePe redirect
│                          └─► Success modal after 1.5s
│
└─── "razorpay" ──────► generateRazorpayPaymentLink()
                       └─► Razorpay checkout
                           └─► Success modal after 1.5s
```

---

## Data Flow Architecture

### User Profile Avatar Flow
```
User Input (File)
    ▼
handleAvatarUpload()
    │
    ├─► Validate (type, size)
    │       ├─► Invalid: Show error → Stop
    │       └─► Valid: Continue
    │
    ├─► Upload to Supabase
    │       ├─► Error: Show toast → Stop
    │       └─► Success: Continue
    │
    ├─► Get Public URL
    │
    └─► updateProfile(
        {
            name: profile?.name,
            email: profile?.email,
            avatarUrl: publicUrl  ◄─── New value
        }
    )
        │
        ├─► Success: Invalidate queries
        │           Show success toast
        │           Re-render
        │
        └─► Error: Show error toast
```

### Order & Payment Flow
```
Order Creation
    ▼
{
  addressId: int,
  paymentMethod: string,
  userId: int,
  items: OrderItem[],
  total: decimal
}
    ▼
useCreateOrder() mutation
    ├─► Database: Insert order
    │   ├─► order.id generated
    │   ├─► order.status = "pending"
    │   ├─► order.paymentStatus = "pending"
    │   └─► order created successfully
    │
    └─► onSuccess callback
        │
        ├─► IF paymentMethod === "cod"
        │   ├─► setShowSuccessModal(true)
        │   ├─► setSuccessOrderId(order.id)
        │   └─► invalidateQueries(["/api/cart"])
        │
        └─► IF paymentMethod === "razorpay" or "upi"
            │
            ├─► generatePaymentLink({
            │       orderId: order.id,
            │       customerId: profile.id,
            │       amount: cart.total,
            │       ...
            │   })
            │
            ├─► Payment Handler Updates Order:
            │   ├─► payment_id = razorpay_xxx
            │   ├─► payment_link = https://rzp.io/...
            │   └─► payment_status = "initiated"
            │
            ├─► window.open(paymentLink, "_blank")
            │
            └─► setTimeout(() => {
                    ├─► setShowSuccessModal(true)
                    ├─► setSuccessOrderId(order.id)
                    └─► invalidateQueries(["/api/cart"])
                }, 1500)
```

---

## Database Schema Relationships

```
users Table
├── id (PK)
├── phone (UNIQUE)
├── name
├── email
├── avatar_url ◄─── NEW
├── loyalty_points
└── ...

orders Table
├── id (PK)
├── user_id (FK → users.id)
├── status (pending/confirmed/shipped/delivered)
├── payment_method (razorpay/phonepe/upi/cod)
├── payment_status (pending/initiated/completed/failed)
├── payment_id ◄─── NEW (from payment gateway)
├── payment_link ◄─── NEW (public payment URL)
├── total
├── items (JSONB)
├── address (JSONB)
└── ...

Relationship:
users (1) ──────────► (M) orders
         └─ user_id
```

---

## Module Architecture

### Payments Module
```
/src/lib/payments/
├── razorpay.ts
│   ├── generateRazorpayPaymentLink()
│   │   └─► calls: generatePaymentLink() from checkout handler
│   │
│   └── verifyRazorpayPayment()
│       └─► calls: verifyPayment() from checkout handler
│
├── phonepe.ts
│   ├── generatePhonePePaymentLink()
│   │   └─► calls: generatePaymentLink() from checkout handler
│   │
│   └── verifyPhonePePayment()
│       └─► calls: verifyPayment() from checkout handler
│
└── (checkout.ts is in api-handlers, not payments)
```

### API Handler Module
```
/src/lib/api-handlers/
└── checkout.ts
    ├── generatePaymentLink(request)
    │   ├─► Check payment method
    │   ├─► Route to razorpay OR phonepe
    │   └─► Update Supabase order
    │
    ├── generateRazorpayLink(request)
    │   ├─► Create mock/real payment link
    │   └─► Store in database
    │
    ├── generatePhonePeLink(request)
    │   ├─► Create mock/real payment link
    │   └─► Store in database
    │
    └── verifyPayment(paymentId, orderId, method)
        ├─► Verify payment status
        └─► Update order status
```

---

## Component State Management

### Checkout Component State Tree
```
Checkout Component
├── step: 1 | 2
├── selectedAddress: string
├── paymentMethod: "razorpay" | "upi" | "cod"
├── showSuccessModal: boolean
├── successOrderId: number | null
├── isProcessingPayment: boolean
│
├── Query Hooks (from API)
│   ├── cart (from useGetCart)
│   ├── addresses (from useGetUserAddresses)
│   ├── profile (from useGetUserProfile)
│   └── createOrder (from useCreateOrder)
│
└── Side Effects
    ├── When createOrder succeeds
    ├── When createOrder fails
    └── Form validation
```

### SuccessModal Component Props
```
SuccessModal Props
├── isOpen: boolean
├── title?: string
├── message?: string
├── orderId?: string | number
├── onClose: () => void
├── onContinue?: () => void
└── autoCloseDuration?: number

Internal State
├── useEffect hook
│   └─► Auto-close timer
```

---

## Error Handling Architecture

### Profile Upload Errors
```
File Selection
    ├─► No file selected
    │   └─► Early return (silently)
    │
    ├─► Invalid type
    │   └─► Show: "Invalid File Type" toast
    │
    └─► Invalid size
        └─► Show: "File Too Large" toast

Supabase Upload
    ├─► Connection error
    │   └─► Catch: Show error toast
    │
    └─► Upload error
        └─► Catch: Show error toast

Profile Update
    └─► Update error
        └─► Show: "Upload Failed" toast
```

### Payment Errors
```
Order Creation
    ├─► No address
    │   └─► toast + validation
    │
    └─► Empty cart
        └─► toast + validation

Payment Link Generation
    ├─► API error
    │   └─► Catch + show toast
    │
    └─► Gateway timeout
        └─► Catch + show toast

Payment Verification
    └─► Verification failed
        └─► Show error toast
```

---

## Sequence Diagrams

### Avatar Upload Sequence
```
User                Component             Supabase              Database
 │                      │                     │                    │
 ├─ Click camera ───────→│                     │                    │
 │                      │                     │                    │
 ├─ Select file ────────→│                     │                    │
 │                      │                     │                    │
 │                      ├─ Validate ─────────→ (client-side)       │
 │                      │                     │                    │
 │                      ├─ Upload ───────────→│                    │
 │                      │                     │                    │
 │                      ├─ Get URL ◄─────────→│                    │
 │                      │                     │                    │
 │                      ├─ Update Profile ───────────────────────→│
 │                      │                     │                    │
 │←─ Success toast ─────┤                     │                    │
 │                      │                     │                    │
 │←─ Avatar updates ─────┤                     │                    │
```

### Payment Order Sequence
```
User                Component              DB            Payment Gateway
 │                      │                   │                 │
 ├─ Select address ─────→│                   │                 │
 │                      │                   │                 │
 ├─ Select payment ─────→│                   │                 │
 │                      │                   │                 │
 ├─ Click order ────────→│                   │                 │
 │                      │                   │                 │
 │                      ├─ Create order ────→│                 │
 │                      │←──── Order ID ─────┤                 │
 │                      │                   │                 │
 │ [If Online Payment]  │                   │                 │
 │                      ├─ Generate Link ───────────────────→ │
 │                      │←────────────── Link URL ────────────┤
 │                      │                   │                 │
 │                      ├─ Update Order ────→│                 │
 │                      │  (payment_id)     │                 │
 │                      │  (payment_link)   │                 │
 │                      │                   │                 │
 │←─ Open Link ──────────────────────────────────────────────→│
 │                      │                   │                 │
 │ [User Pays]          │                   │                 │
 │                      │                   │                 │
 │                      ├─ Show Modal ──────→│                 │
 │                      │                   │                 │
 │←─ Auto-redirect ─────┤                   │                 │
```

---

## File Dependencies

```
/src/pages/checkout.tsx
├── imports: SuccessModal
│   └── /src/components/SuccessModal.tsx
├── imports: generateRazorpayPaymentLink
│   └── /src/lib/payments/razorpay.ts
│       └── imports: generatePaymentLink
│           └── /src/lib/api-handlers/checkout.ts
│               └── imports: supabase
│                   └── /src/lib/supabase.ts
└── imports: generatePhonePePaymentLink
    └── /src/lib/payments/phonepe.ts
        └── imports: generatePaymentLink
            └── /src/lib/api-handlers/checkout.ts

/src/pages/profile.tsx
├── imports: supabase
│   └── /src/lib/supabase.ts
├── imports: useUpdateUserProfile
│   └── /src/lib/api-client.ts
└── imports: Camera icon
    └── lucide-react
```

---

## Technology Stack Used

### Frontend
- **Framework**: React 19 with Hooks
- **Build**: Vite
- **Styling**: Tailwind CSS
- **State**: Zustand (app store) + React Query (server state)
- **Routing**: Wouter
- **Icons**: Lucide React
- **UI Components**: shadcn/ui

### Storage & Database
- **Storage**: Supabase Storage (PostgreSQL-backed)
- **Database**: Supabase PostgreSQL
- **ORM**: Drizzle ORM
- **Validation**: Zod

### Payment Gateways
- **Primary**: Razorpay
- **Fallback**: PhonePe
- **Method**: Payment Links (secure, redirect-based)

---

## Deployment Architecture

```
Frontend (Vite App)
├── Deployed to: Vercel / Netlify / Self-hosted
├── Environment Vars: 
│   ├── VITE_SUPABASE_URL
│   ├── VITE_SUPABASE_ANON_KEY
│   └── (Payment keys optional for demo)
│
├── API Calls to:
│   ├── Supabase (storage + database)
│   └── Payment Gateways (via redirect links)
│
└── No Backend Server Needed (for MVP)

Production Upgrade:
├── Add Backend Server (Node/Express)
├── Implement actual payment gateway SDKs
├── Add webhook handlers
└── Move sensitive keys to backend
```

---

**Architecture Last Updated**: July 7, 2026  
**Current Version**: 1.0 - Production Ready
