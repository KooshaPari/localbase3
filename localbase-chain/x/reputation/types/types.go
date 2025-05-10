package types

import (
	sdk "github.com/cosmos/cosmos-sdk/types"
)

// Reputation represents a provider's reputation in the LocalBase marketplace
type Reputation struct {
	ProviderID       string    `json:"provider_id"`
	Score            sdk.Dec   `json:"score"`
	TotalJobs        int64     `json:"total_jobs"`
	SuccessfulJobs   int64     `json:"successful_jobs"`
	FailedJobs       int64     `json:"failed_jobs"`
	AverageLatency   int64     `json:"average_latency"`
	Ratings          []Rating  `json:"ratings"`
	UpdatedAt        int64     `json:"updated_at"`
}

// Rating represents a user's rating of a provider
type Rating struct {
	Creator     sdk.AccAddress `json:"creator"`
	JobID       string         `json:"job_id"`
	Score       int            `json:"score"`
	Comment     string         `json:"comment"`
	CreatedAt   int64          `json:"created_at"`
}

// NewReputation creates a new Reputation instance
func NewReputation(
	providerID string,
) Reputation {
	return Reputation{
		ProviderID:     providerID,
		Score:          sdk.NewDecWithPrec(95, 2), // Default reputation 0.95
		TotalJobs:      0,
		SuccessfulJobs: 0,
		FailedJobs:     0,
		AverageLatency: 0,
		Ratings:        []Rating{},
		UpdatedAt:      sdk.Context{}.BlockTime().Unix(),
	}
}

// ValidateBasic performs basic validation of a reputation
func (r Reputation) ValidateBasic() error {
	if r.ProviderID == "" {
		return ErrEmptyProviderID
	}
	if r.Score.IsNegative() || r.Score.GT(sdk.OneDec()) {
		return ErrInvalidScore
	}
	return nil
}

// NewRating creates a new Rating instance
func NewRating(
	creator sdk.AccAddress,
	jobID string,
	score int,
	comment string,
) Rating {
	return Rating{
		Creator:   creator,
		JobID:     jobID,
		Score:     score,
		Comment:   comment,
		CreatedAt: sdk.Context{}.BlockTime().Unix(),
	}
}

// ValidateBasic performs basic validation of a rating
func (r Rating) ValidateBasic() error {
	if r.Creator.Empty() {
		return ErrEmptyCreatorAddr
	}
	if r.JobID == "" {
		return ErrEmptyJobID
	}
	if r.Score < 1 || r.Score > 5 {
		return ErrInvalidRatingScore
	}
	return nil
}
