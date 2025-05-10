package types

import (
	sdkerrors "cosmossdk.io/errors"
)

// Governance module sentinel errors
var (
	ErrUnknownProposal         = sdkerrors.Register(ModuleName, 1, "unknown proposal")
	ErrInactiveProposal        = sdkerrors.Register(ModuleName, 2, "inactive proposal")
	ErrAlreadyActiveProposal   = sdkerrors.Register(ModuleName, 3, "proposal already active")
	ErrInvalidProposalContent  = sdkerrors.Register(ModuleName, 4, "invalid proposal content")
	ErrInvalidProposalType     = sdkerrors.Register(ModuleName, 5, "invalid proposal type")
	ErrInvalidVote             = sdkerrors.Register(ModuleName, 6, "invalid vote option")
	ErrInvalidGenesis          = sdkerrors.Register(ModuleName, 7, "invalid genesis state")
	ErrNoProposalHandlerExists = sdkerrors.Register(ModuleName, 8, "no handler exists for proposal type")
	ErrUnknownVote             = sdkerrors.Register(ModuleName, 9, "unknown vote")
	ErrUnknownDeposit          = sdkerrors.Register(ModuleName, 10, "unknown deposit")
	ErrInsufficientDeposit     = sdkerrors.Register(ModuleName, 11, "insufficient deposit")
	ErrVotingPeriodEnded       = sdkerrors.Register(ModuleName, 12, "voting period ended")
	ErrDepositPeriodEnded      = sdkerrors.Register(ModuleName, 13, "deposit period ended")
	ErrAlreadyVoted            = sdkerrors.Register(ModuleName, 14, "already voted")
	ErrInvalidProposer         = sdkerrors.Register(ModuleName, 15, "invalid proposer")
)
