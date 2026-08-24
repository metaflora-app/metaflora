import { buildProviderCoverageReport } from '../src/provider-coverage.js';

process.stdout.write(`${JSON.stringify(buildProviderCoverageReport(), null, 2)}\n`);
