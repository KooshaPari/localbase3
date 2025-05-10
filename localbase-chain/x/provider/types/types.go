package types

import (
	sdk "github.com/cosmos/cosmos-sdk/types"
)

// Provider represents a GPU provider in the LocalBase marketplace
type Provider struct {
	ID              string            `json:"id"`
	Owner           sdk.AccAddress    `json:"owner"`
	Name            string            `json:"name"`
	HardwareInfo    HardwareInfo      `json:"hardware_info"`
	BenchmarkResults BenchmarkResults `json:"benchmark_results"`
	ModelsSupported []string          `json:"models_supported"`
	Pricing         map[string]Pricing `json:"pricing"`
	Status          string            `json:"status"`
	Region          string            `json:"region"`
	AvgResponseTime int64             `json:"avg_response_time"`
	Reputation      sdk.Dec           `json:"reputation"`
	CreatedAt       int64             `json:"created_at"`
	UpdatedAt       int64             `json:"updated_at"`
}

// HardwareInfo represents the hardware specifications of a provider
type HardwareInfo struct {
	GPUType  string `json:"gpu_type"`
	VRAM     string `json:"vram"`
	CPUCores int    `json:"cpu_cores"`
	RAM      string `json:"ram"`
}

// BenchmarkResults represents the benchmark results of a provider
type BenchmarkResults struct {
	InferenceSpeed int `json:"inference_speed"`
	MaxBatchSize   int `json:"max_batch_size"`
}

// Pricing represents the pricing information for a model
type Pricing struct {
	InputPricePerToken  sdk.Dec `json:"input_price_per_token"`
	OutputPricePerToken sdk.Dec `json:"output_price_per_token"`
}

// NewProvider creates a new Provider instance
func NewProvider(
	id string,
	owner sdk.AccAddress,
	name string,
	hardwareInfo HardwareInfo,
	benchmarkResults BenchmarkResults,
	modelsSupported []string,
	pricing map[string]Pricing,
	status string,
	region string,
	avgResponseTime int64,
) Provider {
	return Provider{
		ID:              id,
		Owner:           owner,
		Name:            name,
		HardwareInfo:    hardwareInfo,
		BenchmarkResults: benchmarkResults,
		ModelsSupported: modelsSupported,
		Pricing:         pricing,
		Status:          status,
		Region:          region,
		AvgResponseTime: avgResponseTime,
		Reputation:      sdk.NewDecWithPrec(95, 2), // Default reputation 0.95
		CreatedAt:       sdk.Context{}.BlockTime().Unix(),
		UpdatedAt:       sdk.Context{}.BlockTime().Unix(),
	}
}

// ValidateBasic performs basic validation of a provider
func (p Provider) ValidateBasic() error {
	if p.ID == "" {
		return ErrEmptyProviderID
	}
	if p.Owner.Empty() {
		return ErrEmptyOwnerAddr
	}
	if p.Name == "" {
		return ErrEmptyProviderName
	}
	if len(p.ModelsSupported) == 0 {
		return ErrNoModelsSupported
	}
	if p.Status == "" {
		return ErrEmptyStatus
	}
	return nil
}

// ProviderStatus represents the status of a provider
const (
	ProviderStatusActive   = "active"
	ProviderStatusInactive = "inactive"
	ProviderStatusPending  = "pending"
)
