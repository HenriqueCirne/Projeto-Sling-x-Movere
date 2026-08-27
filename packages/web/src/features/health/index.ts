// API pública da feature `health` — importe SOMENTE a partir daqui.

export type {
  DatabaseHealth,
  DatabaseStatus,
  HealthContract,
  HealthReport,
  HealthStatus,
} from './health.contract';

export { healthService } from './services/health.service';
