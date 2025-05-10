import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Decentralized AI Compute',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        LocalBase connects users who need AI compute resources with providers who have GPU capacity to offer,
        creating a more accessible, affordable, and decentralized alternative to centralized AI services.
      </>
    ),
  },
  {
    title: 'Blockchain-Powered Marketplace',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        Built on the Cosmos SDK, LocalBase provides a secure and transparent marketplace for AI compute resources,
        with on-chain governance, provider reputation, and fair payment systems.
      </>
    ),
  },
  {
    title: 'OpenAI-Compatible API',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        LocalBase provides an OpenAI-compatible API, making it easy to integrate with existing applications
        and frameworks that already use OpenAI's API.
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
