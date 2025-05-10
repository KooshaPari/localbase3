---
sidebar_position: 7
---

# Billing

The Billing API allows you to retrieve billing information, manage payment methods, and view invoices.

## Retrieve Billing Information

```
GET /billing
```

Retrieves billing information for the current user.

### Request

#### Headers

- `Authorization`: Your API key

### Response

```json
{
  "subscription": {
    "plan": "standard",
    "status": "active",
    "current_period_start": "2023-01-01T00:00:00Z",
    "current_period_end": "2023-02-01T00:00:00Z",
    "cancel_at_period_end": false
  },
  "balance": {
    "amount": 100.0,
    "currency": "USD"
  },
  "payment_method": {
    "id": "pm-123456",
    "type": "card",
    "card": {
      "brand": "visa",
      "last4": "4242",
      "exp_month": 12,
      "exp_year": 2025
    }
  },
  "usage_this_month": {
    "amount": 25.0,
    "currency": "USD"
  },
  "usage_limit": {
    "amount": 500.0,
    "currency": "USD"
  }
}
```

### Example

```bash
curl https://api.localbase.io/v1/billing \
  -H "Authorization: Bearer your-api-key"
```

## Update Subscription

```
PATCH /billing/subscription
```

Updates the subscription plan for the current user.

### Request

#### Headers

- `Authorization`: Your API key
- `Content-Type`: `application/json`

#### Body

```json
{
  "plan": "professional",
  "cancel_at_period_end": false
}
```

#### Parameters

- `plan` (optional): The subscription plan to switch to
- `cancel_at_period_end` (optional): Whether to cancel the subscription at the end of the current period

### Response

```json
{
  "subscription": {
    "plan": "professional",
    "status": "active",
    "current_period_start": "2023-01-01T00:00:00Z",
    "current_period_end": "2023-02-01T00:00:00Z",
    "cancel_at_period_end": false
  }
}
```

### Example

```bash
curl -X PATCH https://api.localbase.io/v1/billing/subscription \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "professional",
    "cancel_at_period_end": false
  }'
```

## List Payment Methods

```
GET /billing/payment-methods
```

Retrieves a list of payment methods for the current user.

### Request

#### Headers

- `Authorization`: Your API key

### Response

```json
{
  "data": [
    {
      "id": "pm-123456",
      "type": "card",
      "card": {
        "brand": "visa",
        "last4": "4242",
        "exp_month": 12,
        "exp_year": 2025
      },
      "created_at": "2023-01-01T00:00:00Z",
      "is_default": true
    },
    {
      "id": "pm-123457",
      "type": "card",
      "card": {
        "brand": "mastercard",
        "last4": "4444",
        "exp_month": 6,
        "exp_year": 2024
      },
      "created_at": "2023-01-01T00:00:00Z",
      "is_default": false
    }
  ]
}
```

### Example

```bash
curl https://api.localbase.io/v1/billing/payment-methods \
  -H "Authorization: Bearer your-api-key"
```

## Add Payment Method

```
POST /billing/payment-methods
```

Adds a new payment method for the current user.

### Request

#### Headers

- `Authorization`: Your API key
- `Content-Type`: `application/json`

#### Body

```json
{
  "payment_method_id": "pm-123458",
  "set_as_default": true
}
```

#### Parameters

- `payment_method_id` (required): The ID of the payment method to add (obtained from the frontend)
- `set_as_default` (optional): Whether to set this payment method as the default (default: false)

### Response

```json
{
  "id": "pm-123458",
  "type": "card",
  "card": {
    "brand": "amex",
    "last4": "0005",
    "exp_month": 3,
    "exp_year": 2026
  },
  "created_at": "2023-01-01T00:00:00Z",
  "is_default": true
}
```

### Example

```bash
curl -X POST https://api.localbase.io/v1/billing/payment-methods \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_method_id": "pm-123458",
    "set_as_default": true
  }'
```

## Update Payment Method

```
PATCH /billing/payment-methods/{id}
```

Updates a payment method for the current user.

### Request

#### Headers

- `Authorization`: Your API key
- `Content-Type`: `application/json`

#### Path Parameters

- `id`: The ID of the payment method to update

#### Body

```json
{
  "set_as_default": true
}
```

#### Parameters

- `set_as_default` (optional): Whether to set this payment method as the default

### Response

```json
{
  "id": "pm-123457",
  "type": "card",
  "card": {
    "brand": "mastercard",
    "last4": "4444",
    "exp_month": 6,
    "exp_year": 2024
  },
  "created_at": "2023-01-01T00:00:00Z",
  "is_default": true
}
```

### Example

```bash
curl -X PATCH https://api.localbase.io/v1/billing/payment-methods/pm-123457 \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "set_as_default": true
  }'
```

## Delete Payment Method

```
DELETE /billing/payment-methods/{id}
```

Deletes a payment method for the current user.

### Request

#### Headers

- `Authorization`: Your API key

#### Path Parameters

- `id`: The ID of the payment method to delete

### Response

```json
{
  "id": "pm-123457",
  "deleted": true
}
```

### Example

```bash
curl -X DELETE https://api.localbase.io/v1/billing/payment-methods/pm-123457 \
  -H "Authorization: Bearer your-api-key"
```

## List Invoices

```
GET /billing/invoices
```

Retrieves a list of invoices for the current user.

### Request

#### Headers

- `Authorization`: Your API key

#### Query Parameters

- `limit` (optional): The maximum number of invoices to return (default: 20, max: 100)
- `offset` (optional): The number of invoices to skip (default: 0)
- `status` (optional): Filter invoices by status (e.g., "paid", "open", "void")

### Response

```json
{
  "data": [
    {
      "id": "in-123456",
      "number": "INV-001",
      "status": "paid",
      "amount": {
        "amount": 50.0,
        "currency": "USD"
      },
      "period_start": "2023-01-01T00:00:00Z",
      "period_end": "2023-01-31T23:59:59Z",
      "created_at": "2023-02-01T00:00:00Z",
      "paid_at": "2023-02-01T00:01:00Z",
      "pdf_url": "https://api.localbase.io/v1/billing/invoices/in-123456/pdf"
    },
    {
      "id": "in-123457",
      "number": "INV-002",
      "status": "open",
      "amount": {
        "amount": 75.0,
        "currency": "USD"
      },
      "period_start": "2023-02-01T00:00:00Z",
      "period_end": "2023-02-28T23:59:59Z",
      "created_at": "2023-03-01T00:00:00Z",
      "paid_at": null,
      "pdf_url": "https://api.localbase.io/v1/billing/invoices/in-123457/pdf"
    }
  ],
  "pagination": {
    "total": 2,
    "limit": 20,
    "offset": 0,
    "has_more": false
  }
}
```

### Example

```bash
curl https://api.localbase.io/v1/billing/invoices \
  -H "Authorization: Bearer your-api-key"
```

## Retrieve an Invoice

```
GET /billing/invoices/{id}
```

Retrieves information about a specific invoice.

### Request

#### Headers

- `Authorization`: Your API key

#### Path Parameters

- `id`: The ID of the invoice to retrieve

### Response

```json
{
  "id": "in-123456",
  "number": "INV-001",
  "status": "paid",
  "amount": {
    "amount": 50.0,
    "currency": "USD"
  },
  "period_start": "2023-01-01T00:00:00Z",
  "period_end": "2023-01-31T23:59:59Z",
  "created_at": "2023-02-01T00:00:00Z",
  "paid_at": "2023-02-01T00:01:00Z",
  "pdf_url": "https://api.localbase.io/v1/billing/invoices/in-123456/pdf",
  "items": [
    {
      "description": "Standard Plan Subscription",
      "amount": {
        "amount": 20.0,
        "currency": "USD"
      }
    },
    {
      "description": "GPT-3.5 Turbo Usage (100,000 tokens)",
      "amount": {
        "amount": 15.0,
        "currency": "USD"
      }
    },
    {
      "description": "GPT-4 Usage (50,000 tokens)",
      "amount": {
        "amount": 15.0,
        "currency": "USD"
      }
    }
  ],
  "payment_method": {
    "id": "pm-123456",
    "type": "card",
    "card": {
      "brand": "visa",
      "last4": "4242",
      "exp_month": 12,
      "exp_year": 2025
    }
  }
}
```

### Example

```bash
curl https://api.localbase.io/v1/billing/invoices/in-123456 \
  -H "Authorization: Bearer your-api-key"
```

## Download Invoice PDF

```
GET /billing/invoices/{id}/pdf
```

Downloads the PDF for a specific invoice.

### Request

#### Headers

- `Authorization`: Your API key

#### Path Parameters

- `id`: The ID of the invoice to download

### Response

The PDF file for the invoice.

### Example

```bash
curl https://api.localbase.io/v1/billing/invoices/in-123456/pdf \
  -H "Authorization: Bearer your-api-key" \
  --output invoice.pdf
```

## Add Credit

```
POST /billing/credit
```

Adds credit to the user's balance.

### Request

#### Headers

- `Authorization`: Your API key
- `Content-Type`: `application/json`

#### Body

```json
{
  "amount": 50.0,
  "currency": "USD",
  "payment_method_id": "pm-123456"
}
```

#### Parameters

- `amount` (required): The amount to add
- `currency` (required): The currency of the amount
- `payment_method_id` (optional): The ID of the payment method to use (if not provided, the default payment method will be used)

### Response

```json
{
  "balance": {
    "amount": 150.0,
    "currency": "USD"
  },
  "transaction": {
    "id": "txn-123456",
    "type": "credit",
    "amount": {
      "amount": 50.0,
      "currency": "USD"
    },
    "created_at": "2023-01-01T00:00:00Z"
  }
}
```

### Example

```bash
curl -X POST https://api.localbase.io/v1/billing/credit \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50.0,
    "currency": "USD",
    "payment_method_id": "pm-123456"
  }'
```

## List Transactions

```
GET /billing/transactions
```

Retrieves a list of transactions for the current user.

### Request

#### Headers

- `Authorization`: Your API key

#### Query Parameters

- `limit` (optional): The maximum number of transactions to return (default: 20, max: 100)
- `offset` (optional): The number of transactions to skip (default: 0)
- `type` (optional): Filter transactions by type (e.g., "credit", "debit")
- `start_date` (optional): Start date for transactions (format: YYYY-MM-DD)
- `end_date` (optional): End date for transactions (format: YYYY-MM-DD)

### Response

```json
{
  "data": [
    {
      "id": "txn-123456",
      "type": "credit",
      "description": "Added credit",
      "amount": {
        "amount": 50.0,
        "currency": "USD"
      },
      "created_at": "2023-01-01T00:00:00Z"
    },
    {
      "id": "txn-123457",
      "type": "debit",
      "description": "Job job-123456",
      "amount": {
        "amount": -0.0015,
        "currency": "USD"
      },
      "created_at": "2023-01-01T00:01:00Z"
    }
  ],
  "pagination": {
    "total": 2,
    "limit": 20,
    "offset": 0,
    "has_more": false
  }
}
```

### Example

```bash
curl https://api.localbase.io/v1/billing/transactions \
  -H "Authorization: Bearer your-api-key"
```

## Subscription Plans

LocalBase offers the following subscription plans:

- `free`: Free tier with limited usage
- `standard`: Standard tier with higher usage limits
- `professional`: Professional tier with even higher usage limits
- `enterprise`: Enterprise tier with custom usage limits

## Invoice Status

Invoices can have the following statuses:

- `draft`: The invoice is a draft and not yet finalized
- `open`: The invoice is open and awaiting payment
- `paid`: The invoice has been paid
- `void`: The invoice has been voided
- `uncollectible`: The invoice is uncollectible

## Transaction Types

Transactions can have the following types:

- `credit`: Credit added to the balance
- `debit`: Debit from the balance (e.g., for job execution)
- `refund`: Refund for a job
- `adjustment`: Manual adjustment to the balance

## Error Handling

If the payment method is invalid, the API will return a `400 Bad Request` response:

```json
{
  "error": {
    "message": "Invalid payment method",
    "type": "invalid_request_error",
    "code": "invalid_payment_method"
  }
}
```

If the user doesn't have permission to access the invoice, the API will return a `403 Forbidden` response:

```json
{
  "error": {
    "message": "Permission denied",
    "type": "permission_error",
    "code": "permission_denied"
  }
}
```

## Next Steps

Now that you understand how to work with billing, you can explore other API endpoints:

- [Models](models.md)
- [Jobs](jobs.md)
- [Providers](providers.md)
- [Users](users.md)
