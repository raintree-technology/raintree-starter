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

export default function OrganizationInviteEmail({
  inviteLink,
  teamName,
  invitedByUsername,
  appName = "Acme",
}: {
  inviteLink: string;
  teamName: string;
  invitedByUsername?: string;
  appName?: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>
        Join {teamName} on {appName}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Join {teamName}</Heading>
          <Text style={text}>
            {invitedByUsername ? `${invitedByUsername} has` : "You have been"}{" "}
            invited you to join <strong>{teamName}</strong> on {appName}.
          </Text>
          <Section style={{ textAlign: "center", margin: "32px 0" }}>
            <Button href={inviteLink} style={button}>
              Accept invitation
            </Button>
          </Section>
          <Text style={link}>{inviteLink}</Text>
          <Text style={muted}>
            If you weren&apos;t expecting this invitation, you can ignore this
            email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
