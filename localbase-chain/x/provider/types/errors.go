package types

import (
	sdkerrors "cosmossdk.io/errors"
)

// Provider module sentinel errors
var (
	ErrEmptyProviderID    = sdkerrors.Register(ModuleName, 1, "provider ID cannot be empty")
	ErrEmptyOwnerAddr     = sdkerrors.Register(ModuleName, 2, "owner address cannot be empty")
	ErrEmptyProviderName  = sdkerrors.Register(ModuleName, 3, "provider name cannot be empty")
	ErrNoModelsSupported  = sdkerrors.Register(ModuleName, 4, "provider must support at least one model")
	ErrEmptyStatus        = sdkerrors.Register(ModuleName, 5, "provider status cannot be empty")
	ErrProviderNotFound   = sdkerrors.Register(ModuleName, 6, "provider not found")
	ErrProviderExists     = sdkerrors.Register(ModuleName, 7, "provider already exists")
	ErrUnauthorized       = sdkerrors.Register(ModuleName, 8, "unauthorized")
	ErrInvalidPricing     = sdkerrors.Register(ModuleName, 9, "invalid pricing")
	ErrInvalidHardwareInfo = sdkerrors.Register(ModuleName, 10, "invalid hardware info")
)
