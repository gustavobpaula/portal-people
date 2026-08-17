import type { PlatformCapabilities } from '@portal/platform-contracts';

export default function Journey({ platform }: { platform: PlatformCapabilities }) {
  return <section><h1>__DOMAIN_NAME__</h1><p>Plataforma: {platform.context.platform}</p></section>;
}
