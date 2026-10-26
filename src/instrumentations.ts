import {
  getNodeAutoInstrumentations,
  type InstrumentationConfigMap,
} from '@opentelemetry/auto-instrumentations-node';
import type { Instrumentation } from '@opentelemetry/instrumentation';

/**
 * Default NestJS configuration; instrumentation selection follows OTEL environment variables.
 */
export function getNestjsConfigMap(): InstrumentationConfigMap {
  return {
    '@opentelemetry/instrumentation-http': {
      ignoreIncomingRequestHook: (request) =>
        (request.url ?? '').startsWith('/health'),
    },
  };
}

/**
 * @param extra - extra instrumentations to add to the instrumentations
 * @param nodeAutoConfigMap - the node auto instrumentations config map
 * @returns
 */
export function getSdkInstrumentations(
  extra: Instrumentation[] = [],
  nodeAutoConfigMap: InstrumentationConfigMap = {},
): Instrumentation[] {
  const autoInstrumentations = getNodeAutoInstrumentations(nodeAutoConfigMap);

  return [...autoInstrumentations, ...extra];
}
