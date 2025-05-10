package types

import (
	sdkerrors "cosmossdk.io/errors"
)

// Job module sentinel errors
var (
	ErrEmptyJobID        = sdkerrors.Register(ModuleName, 1, "job ID cannot be empty")
	ErrEmptyCreatorAddr  = sdkerrors.Register(ModuleName, 2, "creator address cannot be empty")
	ErrEmptyProviderID   = sdkerrors.Register(ModuleName, 3, "provider ID cannot be empty")
	ErrEmptyModel        = sdkerrors.Register(ModuleName, 4, "model cannot be empty")
	ErrEmptyInput        = sdkerrors.Register(ModuleName, 5, "input cannot be empty")
	ErrEmptyStatus       = sdkerrors.Register(ModuleName, 6, "job status cannot be empty")
	ErrJobNotFound       = sdkerrors.Register(ModuleName, 7, "job not found")
	ErrJobExists         = sdkerrors.Register(ModuleName, 8, "job already exists")
	ErrUnauthorized      = sdkerrors.Register(ModuleName, 9, "unauthorized")
	ErrInvalidStatus     = sdkerrors.Register(ModuleName, 10, "invalid status transition")
	ErrProviderNotFound  = sdkerrors.Register(ModuleName, 11, "provider not found")
	ErrInsufficientFunds = sdkerrors.Register(ModuleName, 12, "insufficient funds for job")
)
