/**
 * Simple test script for the LocalBase API Gateway
 */

console.log('Testing LocalBase API Gateway...');

try {
  // Load the app
  const app = require('./src/app');
  console.log('App loaded successfully!');
  
  // Check if routes are defined
  const routes = app._router.stack
    .filter(r => r.route)
    .map(r => ({
      path: r.route.path,
      methods: Object.keys(r.route.methods).join(', ')
    }));
  
  console.log('Routes defined:');
  routes.forEach(route => {
    console.log(`- ${route.methods.toUpperCase()} ${route.path}`);
  });
  
  console.log('Test completed successfully!');
} catch (error) {
  console.error('Error testing app:', error);
}
