package types

import (
	"fmt"
	"strings"

	sdk "github.com/cosmos/cosmos-sdk/types"
	govtypes "github.com/cosmos/cosmos-sdk/x/gov/types"
)

const (
	// ProposalTypeParameterChange defines the type for a ParameterChangeProposal
	ProposalTypeParameterChange = "ParameterChange"

	// ProposalTypeProviderPolicy defines the type for a ProviderPolicyProposal
	ProposalTypeProviderPolicy = "ProviderPolicy"

	// ProposalTypeModelPolicy defines the type for a ModelPolicyProposal
	ProposalTypeModelPolicy = "ModelPolicy"

	// ProposalTypeSoftwareUpgrade defines the type for a SoftwareUpgradeProposal
	ProposalTypeSoftwareUpgrade = "SoftwareUpgrade"
)

// Assert that all proposals implement the govtypes.Content interface
var (
	_ govtypes.Content = &ParameterChangeProposal{}
	_ govtypes.Content = &ProviderPolicyProposal{}
	_ govtypes.Content = &ModelPolicyProposal{}
	_ govtypes.Content = &SoftwareUpgradeProposal{}
)

// ParameterChangeProposal defines a proposal to change one or more parameters
type ParameterChangeProposal struct {
	Title       string        `json:"title" yaml:"title"`
	Description string        `json:"description" yaml:"description"`
	Changes     []ParamChange `json:"changes" yaml:"changes"`
}

// NewParameterChangeProposal creates a new parameter change proposal
func NewParameterChangeProposal(title, description string, changes []ParamChange) *ParameterChangeProposal {
	return &ParameterChangeProposal{
		Title:       title,
		Description: description,
		Changes:     changes,
	}
}

// GetTitle returns the title of the proposal
func (pcp *ParameterChangeProposal) GetTitle() string { return pcp.Title }

// GetDescription returns the description of the proposal
func (pcp *ParameterChangeProposal) GetDescription() string { return pcp.Description }

// ProposalRoute returns the routing key of the proposal
func (pcp *ParameterChangeProposal) ProposalRoute() string { return RouterKey }

// ProposalType returns the type of the proposal
func (pcp *ParameterChangeProposal) ProposalType() string { return ProposalTypeParameterChange }

// ValidateBasic validates the proposal
func (pcp *ParameterChangeProposal) ValidateBasic() error {
	if len(strings.TrimSpace(pcp.Title)) == 0 {
		return govtypes.ErrInvalidProposalContent("title is required")
	}
	if len(pcp.Title) > govtypes.MaxTitleLength {
		return govtypes.ErrInvalidProposalContent("title length is longer than maximum allowed")
	}

	if len(strings.TrimSpace(pcp.Description)) == 0 {
		return govtypes.ErrInvalidProposalContent("description is required")
	}
	if len(pcp.Description) > govtypes.MaxDescriptionLength {
		return govtypes.ErrInvalidProposalContent("description length is longer than maximum allowed")
	}

	if len(pcp.Changes) == 0 {
		return govtypes.ErrInvalidProposalContent("parameter changes are required")
	}

	for _, change := range pcp.Changes {
		if err := change.ValidateBasic(); err != nil {
			return err
		}
	}

	return nil
}

// String implements the Stringer interface
func (pcp ParameterChangeProposal) String() string {
	var b strings.Builder

	b.WriteString(fmt.Sprintf(`Parameter Change Proposal:
  Title:       %s
  Description: %s
  Changes:
`, pcp.Title, pcp.Description))

	for _, change := range pcp.Changes {
		b.WriteString(fmt.Sprintf(`    %s
`, change.String()))
	}

	return b.String()
}

// ParamChange defines a parameter change
type ParamChange struct {
	Subspace string `json:"subspace" yaml:"subspace"`
	Key      string `json:"key" yaml:"key"`
	Value    string `json:"value" yaml:"value"`
}

// NewParamChange creates a new parameter change
func NewParamChange(subspace, key, value string) ParamChange {
	return ParamChange{
		Subspace: subspace,
		Key:      key,
		Value:    value,
	}
}

// ValidateBasic validates the parameter change
func (pc ParamChange) ValidateBasic() error {
	if len(strings.TrimSpace(pc.Subspace)) == 0 {
		return govtypes.ErrInvalidProposalContent("param change subspace is required")
	}
	if len(strings.TrimSpace(pc.Key)) == 0 {
		return govtypes.ErrInvalidProposalContent("param change key is required")
	}
	if len(strings.TrimSpace(pc.Value)) == 0 {
		return govtypes.ErrInvalidProposalContent("param change value is required")
	}

	return nil
}

// String implements the Stringer interface
func (pc ParamChange) String() string {
	return fmt.Sprintf("Subspace: %s, Key: %s, Value: %s", pc.Subspace, pc.Key, pc.Value)
}

// ProviderPolicyProposal defines a proposal to change provider policies
type ProviderPolicyProposal struct {
	Title       string `json:"title" yaml:"title"`
	Description string `json:"description" yaml:"description"`
	MinStake    string `json:"min_stake" yaml:"min_stake"`
	MaxFee      string `json:"max_fee" yaml:"max_fee"`
	MinUptime   string `json:"min_uptime" yaml:"min_uptime"`
}

// NewProviderPolicyProposal creates a new provider policy proposal
func NewProviderPolicyProposal(title, description, minStake, maxFee, minUptime string) *ProviderPolicyProposal {
	return &ProviderPolicyProposal{
		Title:       title,
		Description: description,
		MinStake:    minStake,
		MaxFee:      maxFee,
		MinUptime:   minUptime,
	}
}

// GetTitle returns the title of the proposal
func (ppp *ProviderPolicyProposal) GetTitle() string { return ppp.Title }

// GetDescription returns the description of the proposal
func (ppp *ProviderPolicyProposal) GetDescription() string { return ppp.Description }

// ProposalRoute returns the routing key of the proposal
func (ppp *ProviderPolicyProposal) ProposalRoute() string { return RouterKey }

// ProposalType returns the type of the proposal
func (ppp *ProviderPolicyProposal) ProposalType() string { return ProposalTypeProviderPolicy }

// ValidateBasic validates the proposal
func (ppp *ProviderPolicyProposal) ValidateBasic() error {
	if len(strings.TrimSpace(ppp.Title)) == 0 {
		return govtypes.ErrInvalidProposalContent("title is required")
	}
	if len(ppp.Title) > govtypes.MaxTitleLength {
		return govtypes.ErrInvalidProposalContent("title length is longer than maximum allowed")
	}

	if len(strings.TrimSpace(ppp.Description)) == 0 {
		return govtypes.ErrInvalidProposalContent("description is required")
	}
	if len(ppp.Description) > govtypes.MaxDescriptionLength {
		return govtypes.ErrInvalidProposalContent("description length is longer than maximum allowed")
	}

	if len(strings.TrimSpace(ppp.MinStake)) == 0 {
		return govtypes.ErrInvalidProposalContent("min stake is required")
	}

	if len(strings.TrimSpace(ppp.MaxFee)) == 0 {
		return govtypes.ErrInvalidProposalContent("max fee is required")
	}

	if len(strings.TrimSpace(ppp.MinUptime)) == 0 {
		return govtypes.ErrInvalidProposalContent("min uptime is required")
	}

	return nil
}

// String implements the Stringer interface
func (ppp ProviderPolicyProposal) String() string {
	return fmt.Sprintf(`Provider Policy Proposal:
  Title:       %s
  Description: %s
  Min Stake:   %s
  Max Fee:     %s
  Min Uptime:  %s`, ppp.Title, ppp.Description, ppp.MinStake, ppp.MaxFee, ppp.MinUptime)
}

// ModelPolicyProposal defines a proposal to change model policies
type ModelPolicyProposal struct {
	Title          string `json:"title" yaml:"title"`
	Description    string `json:"description" yaml:"description"`
	MinAccuracy    string `json:"min_accuracy" yaml:"min_accuracy"`
	MaxLatency     string `json:"max_latency" yaml:"max_latency"`
	AllowedModels  string `json:"allowed_models" yaml:"allowed_models"`
	BlockedModels  string `json:"blocked_models" yaml:"blocked_models"`
	ContentFilters string `json:"content_filters" yaml:"content_filters"`
}

// NewModelPolicyProposal creates a new model policy proposal
func NewModelPolicyProposal(title, description, minAccuracy, maxLatency, allowedModels, blockedModels, contentFilters string) *ModelPolicyProposal {
	return &ModelPolicyProposal{
		Title:          title,
		Description:    description,
		MinAccuracy:    minAccuracy,
		MaxLatency:     maxLatency,
		AllowedModels:  allowedModels,
		BlockedModels:  blockedModels,
		ContentFilters: contentFilters,
	}
}

// GetTitle returns the title of the proposal
func (mpp *ModelPolicyProposal) GetTitle() string { return mpp.Title }

// GetDescription returns the description of the proposal
func (mpp *ModelPolicyProposal) GetDescription() string { return mpp.Description }

// ProposalRoute returns the routing key of the proposal
func (mpp *ModelPolicyProposal) ProposalRoute() string { return RouterKey }

// ProposalType returns the type of the proposal
func (mpp *ModelPolicyProposal) ProposalType() string { return ProposalTypeModelPolicy }

// ValidateBasic validates the proposal
func (mpp *ModelPolicyProposal) ValidateBasic() error {
	if len(strings.TrimSpace(mpp.Title)) == 0 {
		return govtypes.ErrInvalidProposalContent("title is required")
	}
	if len(mpp.Title) > govtypes.MaxTitleLength {
		return govtypes.ErrInvalidProposalContent("title length is longer than maximum allowed")
	}

	if len(strings.TrimSpace(mpp.Description)) == 0 {
		return govtypes.ErrInvalidProposalContent("description is required")
	}
	if len(mpp.Description) > govtypes.MaxDescriptionLength {
		return govtypes.ErrInvalidProposalContent("description length is longer than maximum allowed")
	}

	return nil
}

// String implements the Stringer interface
func (mpp ModelPolicyProposal) String() string {
	return fmt.Sprintf(`Model Policy Proposal:
  Title:           %s
  Description:     %s
  Min Accuracy:    %s
  Max Latency:     %s
  Allowed Models:  %s
  Blocked Models:  %s
  Content Filters: %s`, mpp.Title, mpp.Description, mpp.MinAccuracy, mpp.MaxLatency, mpp.AllowedModels, mpp.BlockedModels, mpp.ContentFilters)
}

// SoftwareUpgradeProposal defines a proposal to upgrade the software
type SoftwareUpgradeProposal struct {
	Title       string `json:"title" yaml:"title"`
	Description string `json:"description" yaml:"description"`
	Plan        Plan   `json:"plan" yaml:"plan"`
}

// Plan defines an upgrade plan
type Plan struct {
	Name   string `json:"name" yaml:"name"`
	Height int64  `json:"height" yaml:"height"`
	Info   string `json:"info" yaml:"info"`
}

// NewSoftwareUpgradeProposal creates a new software upgrade proposal
func NewSoftwareUpgradeProposal(title, description string, plan Plan) *SoftwareUpgradeProposal {
	return &SoftwareUpgradeProposal{
		Title:       title,
		Description: description,
		Plan:        plan,
	}
}

// GetTitle returns the title of the proposal
func (sup *SoftwareUpgradeProposal) GetTitle() string { return sup.Title }

// GetDescription returns the description of the proposal
func (sup *SoftwareUpgradeProposal) GetDescription() string { return sup.Description }

// ProposalRoute returns the routing key of the proposal
func (sup *SoftwareUpgradeProposal) ProposalRoute() string { return RouterKey }

// ProposalType returns the type of the proposal
func (sup *SoftwareUpgradeProposal) ProposalType() string { return ProposalTypeSoftwareUpgrade }

// ValidateBasic validates the proposal
func (sup *SoftwareUpgradeProposal) ValidateBasic() error {
	if len(strings.TrimSpace(sup.Title)) == 0 {
		return govtypes.ErrInvalidProposalContent("title is required")
	}
	if len(sup.Title) > govtypes.MaxTitleLength {
		return govtypes.ErrInvalidProposalContent("title length is longer than maximum allowed")
	}

	if len(strings.TrimSpace(sup.Description)) == 0 {
		return govtypes.ErrInvalidProposalContent("description is required")
	}
	if len(sup.Description) > govtypes.MaxDescriptionLength {
		return govtypes.ErrInvalidProposalContent("description length is longer than maximum allowed")
	}

	if len(strings.TrimSpace(sup.Plan.Name)) == 0 {
		return govtypes.ErrInvalidProposalContent("plan name is required")
	}

	if sup.Plan.Height <= 0 {
		return govtypes.ErrInvalidProposalContent("plan height must be positive")
	}

	return nil
}

// String implements the Stringer interface
func (sup SoftwareUpgradeProposal) String() string {
	return fmt.Sprintf(`Software Upgrade Proposal:
  Title:       %s
  Description: %s
  Plan:
    Name:   %s
    Height: %d
    Info:   %s`, sup.Title, sup.Description, sup.Plan.Name, sup.Plan.Height, sup.Plan.Info)
}
