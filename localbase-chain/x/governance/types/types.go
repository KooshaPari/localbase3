package types

import (
	sdk "github.com/cosmos/cosmos-sdk/types"
	"time"
)

// Proposal represents a governance proposal
type Proposal struct {
	ID          uint64         `json:"id"`
	Title       string         `json:"title"`
	Description string         `json:"description"`
	ProposalType string         `json:"proposal_type"`
	Status      string         `json:"status"`
	Proposer    sdk.AccAddress `json:"proposer"`
	SubmitTime  time.Time      `json:"submit_time"`
	DepositEnd  time.Time      `json:"deposit_end"`
	VotingStart time.Time      `json:"voting_start"`
	VotingEnd   time.Time      `json:"voting_end"`
	TotalDeposit sdk.Coins      `json:"total_deposit"`
	FinalTallyResult TallyResult   `json:"final_tally_result"`
}

// TallyResult represents the result of a proposal vote
type TallyResult struct {
	Yes        sdk.Int `json:"yes"`
	No         sdk.Int `json:"no"`
	Abstain    sdk.Int `json:"abstain"`
	NoWithVeto sdk.Int `json:"no_with_veto"`
}

// Vote represents a vote on a proposal
type Vote struct {
	ProposalID uint64         `json:"proposal_id"`
	Voter      sdk.AccAddress `json:"voter"`
	Option     string         `json:"option"`
}

// Deposit represents a deposit on a proposal
type Deposit struct {
	ProposalID uint64         `json:"proposal_id"`
	Depositor  sdk.AccAddress `json:"depositor"`
	Amount     sdk.Coins      `json:"amount"`
}

// NewProposal creates a new proposal
func NewProposal(
	title string,
	description string,
	proposalType string,
	proposer sdk.AccAddress,
	submitTime time.Time,
	depositEnd time.Time,
) Proposal {
	return Proposal{
		Title:       title,
		Description: description,
		ProposalType: proposalType,
		Status:      StatusDepositPeriod,
		Proposer:    proposer,
		SubmitTime:  submitTime,
		DepositEnd:  depositEnd,
		TotalDeposit: sdk.NewCoins(),
		FinalTallyResult: TallyResult{
			Yes:        sdk.ZeroInt(),
			No:         sdk.ZeroInt(),
			Abstain:    sdk.ZeroInt(),
			NoWithVeto: sdk.ZeroInt(),
		},
	}
}

// ProposalStatus represents the status of a proposal
const (
	StatusDepositPeriod = "DepositPeriod"
	StatusVotingPeriod  = "VotingPeriod"
	StatusPassed        = "Passed"
	StatusRejected      = "Rejected"
	StatusFailed        = "Failed"
)

// VoteOption represents a vote option
const (
	OptionYes        = "Yes"
	OptionNo         = "No"
	OptionAbstain    = "Abstain"
	OptionNoWithVeto = "NoWithVeto"
)

// ProposalType represents the type of a proposal
const (
	ProposalTypeText            = "Text"
	ProposalTypeParameterChange = "ParameterChange"
	ProposalTypeSoftwareUpgrade = "SoftwareUpgrade"
	ProposalTypeProviderPolicy  = "ProviderPolicy"
	ProposalTypeModelPolicy     = "ModelPolicy"
)
