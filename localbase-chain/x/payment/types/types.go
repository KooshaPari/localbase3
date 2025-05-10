package types

import (
	sdk "github.com/cosmos/cosmos-sdk/types"
)

// Payment represents a payment for a job in the LocalBase marketplace
type Payment struct {
	ID          string         `json:"id"`
	JobID       string         `json:"job_id"`
	Creator     sdk.AccAddress `json:"creator"`
	Provider    sdk.AccAddress `json:"provider"`
	Amount      sdk.Coins      `json:"amount"`
	Status      string         `json:"status"`
	EscrowAddr  sdk.AccAddress `json:"escrow_addr"`
	CreatedAt   int64          `json:"created_at"`
	CompletedAt int64          `json:"completed_at"`
	RefundedAt  int64          `json:"refunded_at"`
}

// NewPayment creates a new Payment instance
func NewPayment(
	id string,
	jobID string,
	creator sdk.AccAddress,
	provider sdk.AccAddress,
	amount sdk.Coins,
	escrowAddr sdk.AccAddress,
) Payment {
	return Payment{
		ID:         id,
		JobID:      jobID,
		Creator:    creator,
		Provider:   provider,
		Amount:     amount,
		Status:     PaymentStatusPending,
		EscrowAddr: escrowAddr,
		CreatedAt:  sdk.Context{}.BlockTime().Unix(),
	}
}

// ValidateBasic performs basic validation of a payment
func (p Payment) ValidateBasic() error {
	if p.ID == "" {
		return ErrEmptyPaymentID
	}
	if p.JobID == "" {
		return ErrEmptyJobID
	}
	if p.Creator.Empty() {
		return ErrEmptyCreatorAddr
	}
	if p.Provider.Empty() {
		return ErrEmptyProviderAddr
	}
	if p.Amount.IsZero() {
		return ErrZeroAmount
	}
	if p.Status == "" {
		return ErrEmptyStatus
	}
	if p.EscrowAddr.Empty() {
		return ErrEmptyEscrowAddr
	}
	return nil
}

// PaymentStatus represents the status of a payment
const (
	PaymentStatusPending   = "pending"
	PaymentStatusCompleted = "completed"
	PaymentStatusRefunded  = "refunded"
	PaymentStatusFailed    = "failed"
)
