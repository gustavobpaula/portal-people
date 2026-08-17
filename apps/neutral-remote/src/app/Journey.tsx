import { Link, Route, Routes } from "react-router-dom";
import { Button, Surface, Text } from "@portal/design-system-web";
import type { PlatformCapabilities } from "@portal/platform-contracts";

function Overview({ platform }: { platform: PlatformCapabilities }) {
  return (
    <Surface as="section" padding="lg" elevation={1}>
      <Text as="h1" variant="heading">
        Remote neutro carregado em runtime
      </Text>
      <Text>Correlação: {platform.context.correlationId}</Text>
      <Link to="details">Ver detalhes da jornada</Link>
    </Surface>
  );
}

function Details({ platform }: { platform: PlatformCapabilities }) {
  return (
    <Surface as="section" padding="lg" elevation={1}>
      <Text as="h1" variant="heading">
        Detalhes da jornada neutra
      </Text>
      <Text>A rota relativa pertence ao remote.</Text>
      <Button type="button" onClick={() => platform.navigate("/")}>
        Voltar ao portal
      </Button>
    </Surface>
  );
}

export default function Journey({
  platform,
}: {
  platform: PlatformCapabilities;
}) {
  return (
    <Routes>
      <Route index element={<Overview platform={platform} />} />
      <Route path="details" element={<Details platform={platform} />} />
    </Routes>
  );
}
