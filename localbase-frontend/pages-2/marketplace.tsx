import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useUser } from '@supabase/auth-helpers-react';

// Mock data for providers
const mockProviders = [
  {
    id: 'provider_1',
    name: 'Provider 1',
    hardware: {
      gpu_type: 'NVIDIA RTX 4090',
      vram: '24GB',
      cpu_cores: 16,
      ram: '64GB'
    },
    benchmark_results: {
      inference_speed: 120,
      max_batch_size: 8
    },
    reputation: 0.98,
    models_supported: ['lb-llama-3-70b', 'lb-mixtral-8x7b'],
    pricing: {
      'lb-llama-3-70b': {
        input_price_per_token: 0.00000002,
        output_price_per_token: 0.00000005
      },
      'lb-mixtral-8x7b': {
        input_price_per_token: 0.00000001,
        output_price_per_token: 0.00000003
      }
    },
    status: 'active',
    region: 'us-west',
    avg_response_time: 150
  },
  {
    id: 'provider_2',
    name: 'Provider 2',
    hardware: {
      gpu_type: 'NVIDIA RTX 3090',
      vram: '24GB',
      cpu_cores: 12,
      ram: '32GB'
    },
    benchmark_results: {
      inference_speed: 100,
      max_batch_size: 6
    },
    reputation: 0.95,
    models_supported: ['lb-llama-3-70b'],
    pricing: {
      'lb-llama-3-70b': {
        input_price_per_token: 0.00000001,
        output_price_per_token: 0.00000004
      }
    },
    status: 'active',
    region: 'eu-central',
    avg_response_time: 180
  },
  {
    id: 'provider_3',
    name: 'Provider 3',
    hardware: {
      gpu_type: 'NVIDIA A100',
      vram: '40GB',
      cpu_cores: 24,
      ram: '128GB'
    },
    benchmark_results: {
      inference_speed: 150,
      max_batch_size: 12
    },
    reputation: 0.97,
    models_supported: ['lb-embedding-ada-002'],
    pricing: {
      'lb-embedding-ada-002': {
        input_price_per_token: 0.00000001,
        output_price_per_token: 0.00000001
      }
    },
    status: 'active',
    region: 'us-east',
    avg_response_time: 80
  }
];

// Mock data for models
const mockModels = [
  {
    id: 'lb-llama-3-70b',
    name: 'Llama 3 70B',
    description: 'Meta\'s Llama 3 70B large language model',
    type: 'text-generation'
  },
  {
    id: 'lb-mixtral-8x7b',
    name: 'Mixtral 8x7B',
    description: 'Mistral AI\'s Mixtral 8x7B mixture of experts model',
    type: 'text-generation'
  },
  {
    id: 'lb-embedding-ada-002',
    name: 'Embedding Ada 002',
    description: 'Text embedding model for vector representations',
    type: 'embedding'
  }
];

// Mock data for regions
const mockRegions = [
  { id: 'us-west', name: 'US West' },
  { id: 'us-east', name: 'US East' },
  { id: 'eu-central', name: 'EU Central' },
  { id: 'ap-southeast', name: 'Asia Pacific Southeast' }
];

export default function Marketplace() {
  const router = useRouter();
  const user = useUser();
  
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [minReputation, setMinReputation] = useState<number>(0.9);
  const [filteredProviders, setFilteredProviders] = useState(mockProviders);
  
  // Apply filters when they change
  useEffect(() => {
    let filtered = [...mockProviders];
    
    if (selectedModel) {
      filtered = filtered.filter(provider => 
        provider.models_supported.includes(selectedModel)
      );
    }
    
    if (selectedRegion) {
      filtered = filtered.filter(provider => 
        provider.region === selectedRegion
      );
    }
    
    filtered = filtered.filter(provider => 
      provider.reputation >= minReputation
    );
    
    setFilteredProviders(filtered);
  }, [selectedModel, selectedRegion, minReputation]);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Marketplace - LocalBase</title>
        <meta name="description" content="Browse and select AI compute providers on the LocalBase marketplace." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Marketplace</h1>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 mb-6">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Filters</h3>
              <p className="mt-1 text-sm text-gray-500">
                Filter providers based on your requirements.
              </p>
            </div>
            <div className="mt-5 md:mt-0 md:col-span-2">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                    Model
                  </label>
                  <select
                    id="model"
                    name="model"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                  >
                    <option value="">All Models</option>
                    {mockModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="region" className="block text-sm font-medium text-gray-700">
                    Region
                  </label>
                  <select
                    id="region"
                    name="region"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                  >
                    <option value="">All Regions</option>
                    {mockRegions.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="sm:col-span-2">
                  <label htmlFor="reputation" className="block text-sm font-medium text-gray-700">
                    Minimum Reputation: {minReputation.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    id="reputation"
                    name="reputation"
                    min="0"
                    max="1"
                    step="0.01"
                    className="mt-1 block w-full"
                    value={minReputation}
                    onChange={(e) => setMinReputation(parseFloat(e.target.value))}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0.00</span>
                    <span>0.50</span>
                    <span>1.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Provider list */}
        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Provider
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hardware
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Models
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pricing
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Performance
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Select</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProviders.map((provider) => (
                      <tr key={provider.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                              <span className="text-indigo-700 font-bold">{provider.name.charAt(0)}</span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {provider.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {mockRegions.find(r => r.id === provider.region)?.name || provider.region}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{provider.hardware.gpu_type}</div>
                          <div className="text-sm text-gray-500">
                            {provider.hardware.vram} VRAM, {provider.hardware.cpu_cores} Cores
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {provider.models_supported.map(modelId => {
                              const model = mockModels.find(m => m.id === modelId);
                              return model ? model.name : modelId;
                            }).join(', ')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {Object.entries(provider.pricing).map(([modelId, pricing]) => {
                              const model = mockModels.find(m => m.id === modelId);
                              return (
                                <div key={modelId} className="mb-1">
                                  <span className="font-medium">{model ? model.name : modelId}:</span>
                                  <div className="text-xs text-gray-500">
                                    Input: ${pricing.input_price_per_token.toFixed(8)}/token
                                    <br />
                                    Output: ${pricing.output_price_per_token.toFixed(8)}/token
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <div className="mr-2">
                              Reputation:
                            </div>
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2.5">
                                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${provider.reputation * 100}%` }}></div>
                              </div>
                              <span className="ml-2">{(provider.reputation * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                          <div className="mt-1">
                            Avg. Response: {provider.avg_response_time}ms
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link href={`/providers/${provider.id}`} className="text-indigo-600 hover:text-indigo-900">
                            Details
                          </Link>
                          {user && (
                            <button
                              className="ml-4 bg-indigo-600 text-white px-3 py-1 rounded-md text-sm hover:bg-indigo-700"
                              onClick={() => router.push(`/dashboard/create-job?provider=${provider.id}`)}
                            >
                              Select
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    
                    {filteredProviders.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          No providers match your filters. Try adjusting your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        
        {/* CTA for providers */}
        <div className="bg-indigo-700 mt-8 rounded-lg shadow-xl">
          <div className="max-w-2xl mx-auto text-center py-10 px-4 sm:py-12 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
              <span className="block">Have a GPU?</span>
              <span className="block">Become a provider and earn tokens.</span>
            </h2>
            <p className="mt-4 text-lg leading-6 text-indigo-200">
              Turn your idle GPU resources into income by joining the LocalBase marketplace as a provider.
            </p>
            <Link href="/providers/register" className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 sm:w-auto">
              Become a Provider
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
