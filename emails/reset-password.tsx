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

export default function ResetPasswordEmail({
  url,
  appName = "Acme",
}: {
  url: string;
  appName?: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Reset your {appName} password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Reset your password</Heading>
          <Text style={text}>
            We received a request to reset your password. Click below to choose
            a new one. This link expires in one hour.
          </Text>
          <Section style={{ textAlign: "center", margin: "32px 0" }}>
            <Button href={url} style={button}>
              Reset password
            </Button>
          </Section>
          <Text style={link}>{url}</Text>
          <Text style={muted}>
            If you didn&apos;t request this, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
