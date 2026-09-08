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

export default function VerifyEmail({
  url,
  appName = "Acme",
}: {
  url: string;
  appName?: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Verify your email address for {appName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Verify your email</Heading>
          <Text style={text}>
            Confirm this email address to finish setting up your {appName}{" "}
            account.
          </Text>
          <Section style={{ textAlign: "center", margin: "32px 0" }}>
            <Button href={url} style={button}>
              Verify email
            </Button>
          </Section>
          <Text style={{ ...text, fontSize: "13px" }}>
            Or paste this link into your browser:
          </Text>
          <Text style={link}>{url}</Text>
          <Text style={muted}>
            If you didn&apos;t create an account, you can safely ignore this
            email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
