import React from "react";
import Link from "next/link";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function HomePage() {
	// Create a Supabase client for server components
	const supabase = createServerComponentClient({ cookies });

	// Get the user session
	const {
		data: { session },
	} = await supabase.auth.getSession();

	// If user is logged in, redirect to dashboard
	if (session) {
		redirect("/dashboard");
	}

	return (
		<div className='flex flex-col min-h-screen'>
			{/* Header */}
			<header className='bg-white shadow-md'>
				<div className='container flex items-center justify-between px-4 py-6 mx-auto'>
					<div className='flex items-center'>
						<span className='text-2xl font-bold text-indigo-600'>
							LocalBase
						</span>
					</div>

					<div className='flex items-center space-x-4'>
						<Link
							href='/signin'
							className='px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-indigo-600 rounded-md hover:bg-indigo-50 transition-all hover:shadow-md'>
							Sign in
						</Link>
						<Link
							href='/signup'
							className='px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 transition-all hover:shadow-md'>
							Sign up
						</Link>
					</div>
				</div>
			</header>

			{/* Hero Section */}
			<section className='flex items-center justify-center flex-1 px-4 py-16 bg-gradient-to-b from-indigo-50 to-white'>
				<div className='container mx-auto'>
					<div className='grid grid-cols-1 gap-12 md:grid-cols-2'>
						<div className='flex flex-col justify-center'>
							<h1 className='text-4xl font-bold text-gray-900 md:text-5xl animate-fadeIn'>
								Decentralized AI Compute Marketplace
							</h1>
							<p className='mt-4 text-xl text-gray-600 animate-fadeIn animation-delay-500'>
								Access powerful AI models or monetize your GPU resources in a
								decentralized marketplace.
							</p>
							<div className='flex flex-col mt-8 space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 animate-fadeIn animation-delay-1000'>
								<Link
									href='/signup'
									className='px-8 py-3 text-base font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-all hover:shadow-lg'>
									Get Started
								</Link>
								<Link
									href='/docs'
									className='px-8 py-3 text-base font-medium text-indigo-600 bg-white border border-indigo-600 rounded-md hover:bg-indigo-50 transition-all hover:shadow-lg'>
									Learn More
								</Link>
							</div>
						</div>

						<div className='flex items-center justify-center'>
							<div className='relative w-full max-w-lg'>
								<div className='absolute top-0 -left-4 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob'></div>
								<div className='absolute top-0 -right-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000'></div>
								<div className='absolute -bottom-8 left-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000'></div>
								<div className='relative'>
									<div className='p-8 bg-white rounded-lg shadow-lg animate-fadeIn animation-delay-1500 animate-float'>
										<div className='flex items-center justify-between mb-4'>
											<div className='flex items-center space-x-2'>
												<div className='w-3 h-3 bg-red-500 rounded-full'></div>
												<div className='w-3 h-3 bg-yellow-500 rounded-full'></div>
												<div className='w-3 h-3 bg-green-500 rounded-full'></div>
											</div>
											<div className='text-xs text-gray-500'>model.py</div>
										</div>
										<pre className='p-4 overflow-auto text-sm font-mono bg-gray-100 rounded-md'>
											<code className='text-gray-800 animate-typing'>
												{`# LocalBase AI Inference
import torch
from transformers import AutoModel

class LocalBaseInference:
    def __init__(self, model_id):
        self.model = AutoModel.from_pretrained(model_id)

    def generate(self, prompt, **kwargs):
        # Process input and generate output
        return self.model.generate(prompt, **kwargs)

# Initialize model
model = LocalBaseInference("lb-llama-7b")

# Generate text
output = model.generate(
    "Explain how LocalBase works",
    max_tokens=100
)`}
											</code>
										</pre>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className='px-4 py-16 bg-white'>
				<div className='container mx-auto'>
					<h2 className='text-3xl font-bold text-center text-gray-900'>
						Why Choose LocalBase?
					</h2>

					<div className='grid grid-cols-1 gap-8 mt-12 sm:grid-cols-2 lg:grid-cols-3 animate-fadeIn animation-delay-500'>
						<div className='p-6 bg-indigo-50 rounded-lg hover:shadow-lg transition-all hover:bg-indigo-100 cursor-pointer'>
							<div className='flex items-center justify-center w-12 h-12 mb-4 text-white bg-indigo-600 rounded-md'>
								<svg
									xmlns='http://www.w3.org/2000/svg'
									className='w-6 h-6'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M13 10V3L4 14h7v7l9-11h-7z'
									/>
								</svg>
							</div>
							<h3 className='mb-2 text-xl font-semibold text-gray-900'>
								High Performance
							</h3>
							<p className='text-gray-600'>
								Access powerful AI models with low latency and high throughput
								for your applications.
							</p>
						</div>

						<div className='p-6 bg-indigo-50 rounded-lg hover:shadow-lg transition-all hover:bg-indigo-100 cursor-pointer'>
							<div className='flex items-center justify-center w-12 h-12 mb-4 text-white bg-indigo-600 rounded-md'>
								<svg
									xmlns='http://www.w3.org/2000/svg'
									className='w-6 h-6'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
									/>
								</svg>
							</div>
							<h3 className='mb-2 text-xl font-semibold text-gray-900'>
								Decentralized Security
							</h3>
							<p className='text-gray-600'>
								Built on blockchain technology for transparent, secure, and
								trustless transactions.
							</p>
						</div>

						<div className='p-6 bg-indigo-50 rounded-lg hover:shadow-lg transition-all hover:bg-indigo-100 cursor-pointer'>
							<div className='flex items-center justify-center w-12 h-12 mb-4 text-white bg-indigo-600 rounded-md'>
								<svg
									xmlns='http://www.w3.org/2000/svg'
									className='w-6 h-6'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
									/>
								</svg>
							</div>
							<h3 className='mb-2 text-xl font-semibold text-gray-900'>
								Cost Effective
							</h3>
							<p className='text-gray-600'>
								Pay only for what you use with transparent pricing and no hidden
								fees.
							</p>
						</div>

						<div className='p-6 bg-indigo-50 rounded-lg hover:shadow-lg transition-all hover:bg-indigo-100 cursor-pointer'>
							<div className='flex items-center justify-center w-12 h-12 mb-4 text-white bg-indigo-600 rounded-md'>
								<svg
									xmlns='http://www.w3.org/2000/svg'
									className='w-6 h-6'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
									/>
								</svg>
							</div>
							<h3 className='mb-2 text-xl font-semibold text-gray-900'>
								Provider Verification
							</h3>
							<p className='text-gray-600'>
								All providers are verified and benchmarked to ensure quality and
								reliability.
							</p>
						</div>

						<div className='p-6 bg-indigo-50 rounded-lg hover:shadow-lg transition-all hover:bg-indigo-100 cursor-pointer'>
							<div className='flex items-center justify-center w-12 h-12 mb-4 text-white bg-indigo-600 rounded-md'>
								<svg
									xmlns='http://www.w3.org/2000/svg'
									className='w-6 h-6'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3'
									/>
								</svg>
							</div>
							<h3 className='mb-2 text-xl font-semibold text-gray-900'>
								Fair Marketplace
							</h3>
							<p className='text-gray-600'>
								Transparent pricing and reputation system ensures a fair
								marketplace for all participants.
							</p>
						</div>

						<div className='p-6 bg-indigo-50 rounded-lg hover:shadow-lg transition-all hover:bg-indigo-100 cursor-pointer'>
							<div className='flex items-center justify-center w-12 h-12 mb-4 text-white bg-indigo-600 rounded-md'>
								<svg
									xmlns='http://www.w3.org/2000/svg'
									className='w-6 h-6'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4'
									/>
								</svg>
							</div>
							<h3 className='mb-2 text-xl font-semibold text-gray-900'>
								Developer Friendly
							</h3>
							<p className='text-gray-600'>
								Simple API, comprehensive documentation, and SDKs for popular
								programming languages.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className='px-4 py-16 bg-indigo-600'>
				<div className='container mx-auto'>
					<div className='max-w-3xl mx-auto text-center'>
						<h2 className='text-3xl font-bold text-white animate-fadeIn'>
							Ready to Get Started?
						</h2>
						<p className='mt-4 text-xl text-indigo-100 animate-fadeIn animation-delay-500'>
							Join the decentralized AI revolution today and start using or
							providing AI compute resources.
						</p>
						<div className='flex flex-col items-center justify-center mt-8 space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 animate-fadeIn animation-delay-1000'>
							<Link
								href='/signup'
								className='px-8 py-3 text-base font-medium text-indigo-600 bg-white rounded-md hover:bg-indigo-50 transition-all hover:shadow-lg'>
								Sign Up Now
							</Link>
							<Link
								href='/docs'
								className='px-8 py-3 text-base font-medium text-white bg-transparent border border-white rounded-md hover:bg-indigo-700 transition-all hover:shadow-lg'>
								Read the Docs
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className='px-4 py-12 bg-gray-900'>
				<div className='container mx-auto'>
					<div className='grid grid-cols-1 gap-8 md:grid-cols-4'>
						<div>
							<h3 className='text-lg font-semibold text-white'>LocalBase</h3>
							<p className='mt-4 text-gray-400'>
								A decentralized marketplace for AI compute resources.
							</p>
						</div>

						<div>
							<h3 className='text-lg font-semibold text-white'>Resources</h3>
							<ul className='mt-4 space-y-2'>
								<li>
									<Link href='/docs' className='text-gray-400 hover:text-white'>
										Documentation
									</Link>
								</li>
								<li>
									<Link
										href='/docs/api'
										className='text-gray-400 hover:text-white'>
										API Reference
									</Link>
								</li>
								<li>
									<Link
										href='/docs/tutorials'
										className='text-gray-400 hover:text-white'>
										Tutorials
									</Link>
								</li>
							</ul>
						</div>

						<div>
							<h3 className='text-lg font-semibold text-white'>Company</h3>
							<ul className='mt-4 space-y-2'>
								<li>
									<Link
										href='/about'
										className='text-gray-400 hover:text-white'>
										About Us
									</Link>
								</li>
								<li>
									<Link href='/blog' className='text-gray-400 hover:text-white'>
										Blog
									</Link>
								</li>
								<li>
									<Link
										href='/contact'
										className='text-gray-400 hover:text-white'>
										Contact
									</Link>
								</li>
							</ul>
						</div>

						<div>
							<h3 className='text-lg font-semibold text-white'>Legal</h3>
							<ul className='mt-4 space-y-2'>
								<li>
									<Link
										href='/terms'
										className='text-gray-400 hover:text-white'>
										Terms of Service
									</Link>
								</li>
								<li>
									<Link
										href='/privacy'
										className='text-gray-400 hover:text-white'>
										Privacy Policy
									</Link>
								</li>
								<li>
									<Link
										href='/cookies'
										className='text-gray-400 hover:text-white'>
										Cookie Policy
									</Link>
								</li>
							</ul>
						</div>
					</div>

					<div className='pt-8 mt-8 border-t border-gray-800'>
						<p className='text-sm text-gray-400'>
							&copy; {new Date().getFullYear()} LocalBase. All rights reserved.
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
