package types

import (
	sdk "github.com/cosmos/cosmos-sdk/types"
	"time"
)

// Validator represents a validator in the LocalBase network
type Validator struct {
	OperatorAddress sdk.ValAddress `json:"operator_address"`
	ConsensusPubkey []byte         `json:"consensus_pubkey"`
	Jailed          bool           `json:"jailed"`
	Status          string         `json:"status"`
	Tokens          sdk.Int        `json:"tokens"`
	DelegatorShares sdk.Dec        `json:"delegator_shares"`
	Description     Description    `json:"description"`
	UnbondingHeight int64          `json:"unbonding_height"`
	UnbondingTime   time.Time      `json:"unbonding_time"`
	Commission      Commission     `json:"commission"`
	MinSelfDelegation sdk.Int      `json:"min_self_delegation"`
}

// Description represents a validator description
type Description struct {
	Moniker         string `json:"moniker"`
	Identity        string `json:"identity"`
	Website         string `json:"website"`
	SecurityContact string `json:"security_contact"`
	Details         string `json:"details"`
}

// Commission represents a validator commission
type Commission struct {
	Rate          sdk.Dec   `json:"rate"`
	MaxRate       sdk.Dec   `json:"max_rate"`
	MaxChangeRate sdk.Dec   `json:"max_change_rate"`
	UpdateTime    time.Time `json:"update_time"`
}

// Delegation represents a delegation from a delegator to a validator
type Delegation struct {
	DelegatorAddress sdk.AccAddress `json:"delegator_address"`
	ValidatorAddress sdk.ValAddress `json:"validator_address"`
	Shares           sdk.Dec        `json:"shares"`
}

// UnbondingDelegation represents an unbonding delegation
type UnbondingDelegation struct {
	DelegatorAddress sdk.AccAddress      `json:"delegator_address"`
	ValidatorAddress sdk.ValAddress      `json:"validator_address"`
	Entries          []UnbondingEntry    `json:"entries"`
}

// UnbondingEntry represents an unbonding entry
type UnbondingEntry struct {
	CreationHeight int64     `json:"creation_height"`
	CompletionTime time.Time `json:"completion_time"`
	InitialBalance sdk.Int   `json:"initial_balance"`
	Balance        sdk.Int   `json:"balance"`
}

// Redelegation represents a redelegation
type Redelegation struct {
	DelegatorAddress    sdk.AccAddress     `json:"delegator_address"`
	ValidatorSrcAddress sdk.ValAddress     `json:"validator_src_address"`
	ValidatorDstAddress sdk.ValAddress     `json:"validator_dst_address"`
	Entries             []RedelegationEntry `json:"entries"`
}

// RedelegationEntry represents a redelegation entry
type RedelegationEntry struct {
	CreationHeight int64     `json:"creation_height"`
	CompletionTime time.Time `json:"completion_time"`
	InitialBalance sdk.Int   `json:"initial_balance"`
	SharesDst      sdk.Dec   `json:"shares_dst"`
}

// NewValidator creates a new validator
func NewValidator(
	operatorAddress sdk.ValAddress,
	consensusPubkey []byte,
	description Description,
	commission Commission,
	minSelfDelegation sdk.Int,
) Validator {
	return Validator{
		OperatorAddress:   operatorAddress,
		ConsensusPubkey:   consensusPubkey,
		Jailed:            false,
		Status:            BondStatusUnbonded,
		Tokens:            sdk.ZeroInt(),
		DelegatorShares:   sdk.ZeroDec(),
		Description:       description,
		UnbondingHeight:   0,
		UnbondingTime:     time.Unix(0, 0).UTC(),
		Commission:        commission,
		MinSelfDelegation: minSelfDelegation,
	}
}

// BondStatus represents the status of a validator
const (
	BondStatusUnbonded  = "Unbonded"
	BondStatusUnbonding = "Unbonding"
	BondStatusBonded    = "Bonded"
)
