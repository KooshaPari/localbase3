/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  // By default, Docusaurus generates a sidebar from the docs folder structure
  tutorialSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/introduction',
        'getting-started/installation',
        'getting-started/quick-start',
        'getting-started/architecture',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/overview',
        {
          type: 'category',
          label: 'Users',
          items: [
            'guides/users/authentication',
            'guides/users/api-keys',
            'guides/users/billing',
          ],
        },
        {
          type: 'category',
          label: 'Providers',
          items: [
            'guides/providers/registration',
            'guides/providers/node-setup',
            'guides/providers/staking',
            'guides/providers/monitoring',
          ],
        },
        {
          type: 'category',
          label: 'Developers',
          items: [
            'guides/developers/api-integration',
            'guides/developers/sdk-usage',
            'guides/developers/custom-models',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api-reference/overview',
        'api-reference/authentication',
        'api-reference/models',
        'api-reference/jobs',
        'api-reference/providers',
        'api-reference/users',
        'api-reference/billing',
        'api-reference/sdk',
      ],
    },
    {
      type: 'category',
      label: 'Blockchain',
      items: [
        'blockchain/overview',
        'blockchain/architecture',
        'blockchain/smart-contracts',
        'blockchain/governance',
        'blockchain/tokenomics',
        'blockchain/validators',
      ],
    },
    {
      type: 'category',
      label: 'Provider Node',
      items: [
        'provider/overview',
        'provider/installation',
        'provider/configuration',
        'provider/security',
        'provider/monitoring',
        'provider/scaling',
        'provider/troubleshooting',
      ],
    },
    {
      type: 'category',
      label: 'Frontend',
      items: [
        'frontend/overview',
        'frontend/installation',
        'frontend/configuration',
        'frontend/customization',
        'frontend/deployment',
      ],
    },
  ],
};

module.exports = sidebars;
