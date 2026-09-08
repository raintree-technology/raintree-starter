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
import { button, container, h1, link, main, muted, text } from "./_styles";

export default function MagicLinkEmail({
  url,
  appName = "Acme",
}: {
  url: string;
  appName?: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Your magic sign-in link for {appName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Sign in to {appName}</Heading>
          <Text style={text}>
            Click the button below to sign in. This link expires shortly.
          </Text>
          <Section style={{ textAlign: "center", margin: "32px 0" }}>
            <Button href={url} style={button}>
              Sign in
            </Button>
          </Section>
          <Text style={link}>{url}</Text>
          <Text style={muted}>
            If you didn&apos;t request this link, you can safely ignore this
            email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
