// @ts-nocheck
import { Surface, Text } from "@portal/design-system-web";
import type { PlatformCapabilities } from "@portal/platform-contracts";
export default function Journey({
  platform,
}: {
  platform: PlatformCapabilities;
}) {
  return (
    <Surface as="section" padding="lg">
      <Text as="h1" variant="heading">
        __DISPLAY_NAME__
      </Text>
      <Text>Plataforma: {platform.context.platform}</Text>
    </Surface>
  );
}
