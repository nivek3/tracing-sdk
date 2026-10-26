# tracing-sdk

A comprehensive OpenTelemetry tracing setup SDK for Node.js applications. This package provides pre-configured OpenTelemetry instrumentation with support for distributed tracing, metrics collection, and observability.

## Features

- 🚀 **Pre-configured OpenTelemetry SDK** - Ready-to-use tracing setup
- 📊 **Automatic instrumentation** - HTTP, Express, PostgreSQL, Redis, and more
- 🔍 **Distributed tracing** - W3C Trace Context and B3 propagation support
- 📈 **Metrics export** - Prometheus metrics endpoint
- 🎯 **OTLP support** - OpenTelemetry Protocol for trace export
- 🛡️ **Graceful shutdown** - Proper cleanup on process termination with HTTP server support
- ⚡ **Performance optimized** - Batch span processing for high-throughput applications
- 🎛️ **Flexible configuration** - Class-based design with customizable options
- 🧪 **Testable** - Easy to mock and test in different environments
- 📝 **Custom logging** - Support for custom logger implementations

## Installation

```bash
npm install tracing-sdk
# or
yarn add tracing-sdk
# or
pnpm add tracing-sdk
```

## Quick Start

### 1. Environment Configuration

Set up your environment variables in a `.env` file:

```env
OTLP_SERVICE_NAME=my-service
OTLP_PROM_PORT=8081
OTLP_PROM_ENDPOINT=/metrics
```

### 2. Basic Usage

```typescript
import { TracingSDK } from 'tracing-sdk';

// Create and start the tracing SDK
const otelSDK = new TracingSDK();
await otelSDK.start();

// Your application code here...

// Gracefully shutdown when done
await tracing.shutdown();
```

### 3. Use in Express Application

```typescript
import { TracingSDK } from 'tracing-sdk';

async function bootstrap() {
  // Create tracing instance
  const tracing = new TracingSDK({
    serviceName: 'my-express-app',
    enableMetrics: true,
    enableTracing: true,
  });
  
  // Start tracing before creating the Express app
  await tracing.start();
  
  // Setup graceful shutdown (doesn't exit process automatically)
  tracing.setupGracefulShutdown();
  
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}

bootstrap();
```

## Configuration

### TracingSDK Options

| Option                  | Type                | Default                         | Description                          |
| ----------------------- | ------------------- | ------------------------------- | ------------------------------------ |
| `serviceName`           | `string`            | `process.env.OTLP_SERVICE_NAME` | Service name for traces and metrics  |
| `promPort`              | `number`            | `8081`                          | Port for Prometheus metrics endpoint |
| `promEndpoint`          | `string`            | `'/metrics'`                    | Path for Prometheus metrics endpoint |
| `enableMetrics`         | `boolean`           | `true`                          | Enable Prometheus metrics export     |
| `enableTracing`         | `boolean`           | `true`                          | Enable OpenTelemetry tracing         |
| `instrumentations`      | `Instrumentation[]` | Auto-instrumentations           | Complete list; replaces defaults, including when empty |
| `instrumentationConfigMap` | `InstrumentationConfigMap` | `getNestjsConfigMap()` | Replaces the default config map; ignored when `instrumentations` is provided |
| `logger`                | `Logger`            | `console`                       | Custom logger implementation         |
| `setupGracefulShutdown` | `boolean`           | `true`                          | Auto-setup graceful shutdown         |

### Environment Variables

| Variable             | Default      | Description                          |
| -------------------- | ------------ | ------------------------------------ |
| `OTLP_SERVICE_NAME`  | `'unknown'`  | Service name for traces and metrics  |
| `OTLP_PROM_PORT`     | `8081`       | Port for Prometheus metrics endpoint |
| `OTLP_PROM_ENDPOINT` | `'/metrics'` | Path for Prometheus metrics endpoint |

### Custom Instrumentations

Providing `instrumentations` replaces the entire default list. For example, `[new PrismaInstrumentation()]` enables only Prisma, and `[]` disables all automatic instrumentations.

To append custom instrumentations to the auto-instrumentations while keeping the default health filter, build the complete list explicitly:

```typescript
import { getNestjsConfigMap, getSdkInstrumentations, TracingSDK } from 'tracing-sdk';
import { PrismaInstrumentation } from '@prisma/instrumentation';

// Create tracing SDK with custom instrumentations
const tracing = new TracingSDK({
  serviceName: 'my-service',
  instrumentations: getSdkInstrumentations(
    [new PrismaInstrumentation()],
    getNestjsConfigMap(),
  ),
});

await tracing.start();
```

When `instrumentations` is omitted, `instrumentationConfigMap` configures the auto-instrumentations. A custom map replaces `getNestjsConfigMap()`; it is not merged with it. To retain the default health filter, start with `getNestjsConfigMap()` and preserve its HTTP settings when adding overrides.

### Advanced Configuration

```typescript
import { TracingSDK } from 'tracing-sdk';

// Create multiple tracing instances with different configs
const productionTracing = new TracingSDK({
  serviceName: 'production-service',
  promPort: 9090,
  enableMetrics: true,
  enableTracing: true,
});

const developmentTracing = new TracingSDK({
  serviceName: 'dev-service',
  promPort: 8081,
  enableMetrics: false, // Disable metrics in dev
  enableTracing: true,
});

// Start both instances
await Promise.all([
  productionTracing.start(),
  developmentTracing.start(),
]);
```

## Supported Instrumentations

When `instrumentations` is omitted, the SDK uses `getNodeAutoInstrumentations()` with the selected config map. Without environment or programmatic overrides, all instrumentations in that bundle are enabled except `fs` and `host-metrics`. These include:

- **HTTP/HTTPS** - Network request tracing
- **Express** - Web framework instrumentation
- **PostgreSQL** - Database query tracing
- **Redis (ioredis)** - Cache operation tracing
- **Pino** - Logging correlation
- **Node.js Core** - Built-in Node.js modules

## API Reference

### TracingSDK Class

#### Constructor
```typescript
new TracingSDK(options?: TracingSDKOptions)
```

#### Methods

- `start(): Promise<void>` - Start the tracing SDK
- `shutdown(): Promise<void>` - Gracefully shutdown the SDK
- `setupGracefulShutdown(server: Server, signals?: NodeJS.Signals[]): Promise<void>` - Setup graceful shutdown handlers with HTTP server
- `isRunning(): boolean` - Check if the SDK is currently running
- `getSDK(): NodeSDK` - Get the underlying OpenTelemetry NodeSDK instance
- `getConfig(): Required<TracingSDKOptions>` - Get current configuration

### Utility Functions

- `shutdownSDK(server: Server, sdk: NodeSDK, logger?: Logger): Promise<void>` - Shutdown SDK with server cleanup
- `shutdownTracing(server: Server, sdk: NodeSDK, signals?: NodeJS.Signals[], logger?: Logger): Promise<void>` - Setup graceful shutdown handlers

## Metrics and Monitoring

### Prometheus Metrics

When `enableMetrics` is `true`, the SDK exposes a Prometheus metrics endpoint at `/metrics` (configurable). You can access metrics at:

```
http://localhost:8081/metrics
```

Setting `enableMetrics: false` disables metric export, including exporters selected by `OTEL_METRICS_EXPORTER`.

### Trace Export

Traces are exported via OTLP HTTP exporter. Configure your OpenTelemetry Collector or backend to receive traces from your application.

Setting `enableTracing: false` disables trace export, including exporters selected by `OTEL_TRACES_EXPORTER`.

Application log export is disabled, including when `OTEL_LOGS_EXPORTER` is set. The `logger` option controls the SDK's own lifecycle messages; it does not configure application log export.

## Propagation

The SDK supports multiple trace context propagation formats:

- **W3C Trace Context** - Standard HTTP headers
- **W3C Baggage** - Custom metadata propagation
- **B3** - Zipkin-style propagation (multi-header encoding)

## Best Practices

### 1. Early Initialization

Start the tracing SDK as early as possible in your application lifecycle:

```typescript
// Start tracing before any other operations
const tracing = new TracingSDK();
await tracing.start();
```

### 2. Graceful Shutdown

Always ensure proper shutdown to flush pending traces:

```typescript
// Option 1: Setup graceful shutdown handlers (doesn't exit process automatically)
tracing.setupGracefulShutdown(['SIGTERM', 'SIGINT']);

// Option 2: Setup graceful shutdown handlers that exit the process
tracing.setupGracefulShutdownWithExit(['SIGTERM', 'SIGINT']);

// Option 3: Manual shutdown handling
process.on('SIGTERM', async () => {
  await tracing.shutdown();
  // Your other cleanup logic here
  process.exit(0);
});
```

**Important**: 
- `setupGracefulShutdown()` - Only shuts down the tracing SDK but doesn't exit the process. This allows you to handle other cleanup logic before exiting.
- `setupGracefulShutdownWithExit()` - Shuts down the tracing SDK and then exits the process automatically. Use this for standalone applications.

### 3. Service Naming

Use descriptive service names for better trace organization:

```typescript
const tracing = new TracingSDK({
  serviceName: 'user-service-api',
});
```

### 4. Health Check Exclusion

When both `instrumentations` and `instrumentationConfigMap` are omitted, the default HTTP configuration excludes every incoming request whose URL starts with `/health`, regardless of method. This includes `/health`, `/healthz`, `/health/live`, `/healthcare`, and URLs with query strings.

The filter in `getNestjsConfigMap()` is:

```typescript
const instrumentationConfigMap = {
  '@opentelemetry/instrumentation-http': {
    ignoreIncomingRequestHook: (request) => (request.url ?? '').startsWith('/health'),
  },
};
```

If either option is provided, retain this filter explicitly as shown in [Custom Instrumentations](#custom-instrumentations).

Instrumentations respect `OTEL_NODE_ENABLED_INSTRUMENTATIONS` and `OTEL_NODE_DISABLED_INSTRUMENTATIONS`. Explicit `enabled` values in a custom `instrumentationConfigMap` take precedence over these environment variables.

## [Examples](https://github.com/nivek3/nestjs-prisma-api)

## Troubleshooting

### Common Issues

1. **Traces not appearing**: Ensure your OpenTelemetry Collector is properly configured and accessible
2. **Missing instrumentations**: Check that all required dependencies are installed

### Debug Mode

Enable debug logging by setting the `OTEL_LOG_LEVEL` environment variable:

```env
OTEL_LOG_LEVEL=debug
```

### Status Checking

```typescript
const tracing = new TracingSDK();

// Check if running
console.log('Is running:', tracing.isRunning());

// Get current config
console.log('Config:', tracing.getConfig());
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue on the [GitHub repository](https://github.com/nivek3/tracing-sdk/issues).
