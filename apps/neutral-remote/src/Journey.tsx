import type { PlatformCapabilities } from '@portal/platform-contracts';

export default function Journey({ platform }: { platform: PlatformCapabilities }) {
  return <section><h1>Remote neutro carregado em runtime</h1><p>Correlação: {platform.context.correlationId}</p></section>;
}
