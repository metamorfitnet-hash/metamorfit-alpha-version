import React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { render } from "@react-email/render";

interface PersonalizedPlanEmailProps {
  name: string;
  downloadUrl: string;
  locale?: string;
}

export const PersonalizedPlanEmail: React.FC<PersonalizedPlanEmailProps> = ({ name, downloadUrl, locale = 'en' }) => {
  const firstName = name.split(" ")[0] || name;
  const isEs = locale === 'es';

  return (
    <Html lang={isEs ? "es" : "en"}>
      <Head />
      <Preview>{isEs ? "Tu plan personalizado de Metamorfit está listo." : "Your Metamorfit personalized plan is ready."}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Text style={styles.brandName}>METAMORFIT</Text>
          </Section>
          <Hr style={styles.divider} />
          <Section style={styles.content}>
            <Heading style={styles.heading}>{isEs ? `Listo, ${firstName}` : `Ready, ${firstName}`}</Heading>
            <Text style={styles.paragraph}>{isEs ? "Tu plan personalizado está listo para descargar." : "Your personalized plan is ready for download."}</Text>
            <a href={downloadUrl} style={styles.button}>{isEs ? "Descargar tu Plan" : "Download Your Plan"}</a>
          </Section>
          <Hr style={styles.divider} />
          <Section style={styles.footer}>
            <Text style={styles.footerText}>{isEs ? "Entregado por Metamorfit" : "Delivered by Metamorfit"}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const styles = {
  body: {
    backgroundColor: "#0a0a0c",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    margin: "0",
    padding: "40px 0",
  },
  container: {
    backgroundColor: "#0e0e10",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    margin: "0 auto",
    maxWidth: "560px",
    padding: "0",
  },
  header: {
    backgroundColor: "#0a0a0c",
    padding: "30px",
    textAlign: "center" as const,
  },
  brandName: {
    color: "#f0ede6",
    fontSize: "20px",
    fontWeight: "bold",
    letterSpacing: "0.2em",
    margin: "0",
  },
  divider: {
    borderColor: "rgba(255,255,255,0.1)",
    margin: "0",
  },
  content: {
    padding: "40px",
    textAlign: "center" as const,
  },
  heading: {
    color: "#f0ede6",
    fontSize: "28px",
    fontWeight: "bold",
    margin: "0 0 20px",
  },
  paragraph: {
    color: "rgba(240,237,230,0.6)",
    fontSize: "16px",
    lineHeight: "1.5",
    margin: "0",
  },
  footer: {
    padding: "20px",
    textAlign: "center" as const,
  },
  footerText: {
    color: "rgba(240,237,230,0.3)",
    fontSize: "12px",
    margin: "0",
  },
  button: {
    backgroundColor: "#c9a84c",
    borderRadius: "4px",
    color: "#000",
    display: "inline-block",
    fontWeight: "bold",
    margin: "30px 0 0",
    padding: "12px 24px",
    textDecoration: "none",
  },
};

export async function renderEmail(name: string, downloadUrl: string, locale: string = 'en') {
  return await render(<PersonalizedPlanEmail name={name} downloadUrl={downloadUrl} locale={locale} />);
}
