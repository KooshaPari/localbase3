package types

import (
	sdkerrors "cosmossdk.io/errors"
)

// Reputation module sentinel errors
var (
	ErrEmptyProviderID     = sdkerrors.Register(ModuleName, 1, "provider ID cannot be empty")
	ErrInvalidScore        = sdkerrors.Register(ModuleName, 2, "reputation score must be between 0 and 1")
	ErrEmptyCreatorAddr    = sdkerrors.Register(ModuleName, 3, "creator address cannot be empty")
	ErrEmptyJobID          = sdkerrors.Register(ModuleName, 4, "job ID cannot be empty")
	ErrInvalidRatingScore  = sdkerrors.Register(ModuleName, 5, "rating score must be between 1 and 5")
	ErrReputationNotFound  = sdkerrors.Register(ModuleName, 6, "reputation not found")
	ErrUnauthorized        = sdkerrors.Register(ModuleName, 7, "unauthorized")
	ErrJobNotCompleted     = sdkerrors.Register(ModuleName, 8, "job not completed")
	ErrAlreadyRated        = sdkerrors.Register(ModuleName, 9, "job already rated")
)
