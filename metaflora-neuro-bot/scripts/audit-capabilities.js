import {
  buildCapabilityCoverage,
  validateCapabilityCoverage
} from '../src/capability-coverage.js';

const report = validateCapabilityCoverage(buildCapabilityCoverage());
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (report.errors.length > 0) process.exitCode = 1;
