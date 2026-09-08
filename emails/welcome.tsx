import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { button, container, h1, main, muted, text } from "./_styles";

export default function WelcomeEmail({
  name,
  dashboardUrl,
  appName = "Acme",
}: {
  name?: string;
  dashboardUrl: string;
  appName?: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to {appName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome{name ? `, ${name}` : ""}!</Heading>
          <Text style={text}>
            Thanks for joining {appName}. Your account is ready — jump into your
            dashboard to get started.
          </Text>
          <Section style={{ textAlign: "center", margin: "32px 0" }}>
            <Button href={dashboardUrl} style={button}>
              Open dashboard
            </Button>
          </Section>
          <Text style={muted}>Need help? Just reply to this email.</Text>
        </Container>
      </Body>
    </Html>
  );
}
