package types

import (
	sdk "github.com/cosmos/cosmos-sdk/types"
)

// Job represents an AI inference job in the LocalBase marketplace
type Job struct {
	ID          string         `json:"id"`
	Creator     sdk.AccAddress `json:"creator"`
	ProviderID  string         `json:"provider_id"`
	Model       string         `json:"model"`
	Input       string         `json:"input"`
	Parameters  string         `json:"parameters"`
	Result      string         `json:"result"`
	Status      string         `json:"status"`
	Error       string         `json:"error"`
	Usage       Usage          `json:"usage"`
	Cost        sdk.Coins      `json:"cost"`
	PaymentID   string         `json:"payment_id"`
	CreatedAt   int64          `json:"created_at"`
	StartedAt   int64          `json:"started_at"`
	CompletedAt int64          `json:"completed_at"`
	FailedAt    int64          `json:"failed_at"`
}

// Usage represents the token usage for a job
type Usage struct {
	InputTokens  int64 `json:"input_tokens"`
	OutputTokens int64 `json:"output_tokens"`
	TotalTokens  int64 `json:"total_tokens"`
}

// NewJob creates a new Job instance
func NewJob(
	id string,
	creator sdk.AccAddress,
	providerID string,
	model string,
	input string,
	parameters string,
	paymentID string,
) Job {
	return Job{
		ID:         id,
		Creator:    creator,
		ProviderID: providerID,
		Model:      model,
		Input:      input,
		Parameters: parameters,
		Status:     JobStatusPending,
		PaymentID:  paymentID,
		CreatedAt:  sdk.Context{}.BlockTime().Unix(),
	}
}

// ValidateBasic performs basic validation of a job
func (j Job) ValidateBasic() error {
	if j.ID == "" {
		return ErrEmptyJobID
	}
	if j.Creator.Empty() {
		return ErrEmptyCreatorAddr
	}
	if j.ProviderID == "" {
		return ErrEmptyProviderID
	}
	if j.Model == "" {
		return ErrEmptyModel
	}
	if j.Input == "" {
		return ErrEmptyInput
	}
	if j.Status == "" {
		return ErrEmptyStatus
	}
	return nil
}

// JobStatus represents the status of a job
const (
	JobStatusPending    = "pending"
	JobStatusProcessing = "processing"
	JobStatusCompleted  = "completed"
	JobStatusFailed     = "failed"
	JobStatusCancelled  = "cancelled"
)
