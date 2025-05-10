package types

import (
	sdkerrors "cosmossdk.io/errors"
)

// Payment module sentinel errors
var (
	ErrEmptyPaymentID    = sdkerrors.Register(ModuleName, 1, "payment ID cannot be empty")
	ErrEmptyJobID        = sdkerrors.Register(ModuleName, 2, "job ID cannot be empty")
	ErrEmptyCreatorAddr  = sdkerrors.Register(ModuleName, 3, "creator address cannot be empty")
	ErrEmptyProviderAddr = sdkerrors.Register(ModuleName, 4, "provider address cannot be empty")
	ErrZeroAmount        = sdkerrors.Register(ModuleName, 5, "payment amount cannot be zero")
	ErrEmptyStatus       = sdkerrors.Register(ModuleName, 6, "payment status cannot be empty")
	ErrEmptyEscrowAddr   = sdkerrors.Register(ModuleName, 7, "escrow address cannot be empty")
	ErrPaymentNotFound   = sdkerrors.Register(ModuleName, 8, "payment not found")
	ErrPaymentExists     = sdkerrors.Register(ModuleName, 9, "payment already exists")
	ErrUnauthorized      = sdkerrors.Register(ModuleName, 10, "unauthorized")
	ErrInvalidStatus     = sdkerrors.Register(ModuleName, 11, "invalid status transition")
	ErrInsufficientFunds = sdkerrors.Register(ModuleName, 12, "insufficient funds for payment")
	ErrEscrowFailed      = sdkerrors.Register(ModuleName, 13, "failed to create escrow")
)
