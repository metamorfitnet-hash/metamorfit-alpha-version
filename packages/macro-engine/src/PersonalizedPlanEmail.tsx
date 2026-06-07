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
  locale?: 'en' | 'es';
}

export const PersonalizedPlanEmail: React.FC<PersonalizedPlanEmailProps> = ({ name, downloadUrl, locale }) => {
  const firstName = name.split(" ")[0] || name;

  const labels = locale === 'es' ? {
    preview: "Salida del Motor Alpha de Metamorfit: Tu plan personalizado está listo.",
    heading: `Listo, ${firstName}`,
    paragraph: "Tu plan personalizado está listo para descargar.",
    button: "Descargar Tu Plan",
    footer: "Entregado por Metamorfit Alpha",
  } : {
    preview: "Metamorfit Alpha Engine Output: Your personalized plan is ready.",
    heading: `Ready, ${firstName}`,
    paragraph: "Your personalized plan is ready for download.",
    button: "Download Your Plan",
    footer: "Delivered by Metamorfit Alpha",
  };

  return (
    <Html lang={locale || 'en'}>
      <Head />
      <Preview>{labels.preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Text style={styles.brandName}>METAMORFIT</Text>
          </Section>
          <Hr style={styles.divider} />
          <Section style={styles.content}>
            <Heading style={styles.heading}>{labels.heading}</Heading>
            <Text style={styles.paragraph}>{labels.paragraph}</Text>
            <a href={downloadUrl} style={styles.button}>{labels.button}</a>
          </Section>
          <Hr style={styles.divider} />
          <Section style={styles.footer}>
            <Text style={styles.footerText}>{labels.footer}</Text>
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

export async function renderEmail(name: string, downloadUrl: string, locale?: 'en' | 'es') {
  return await render(<PersonalizedPlanEmail name={name} downloadUrl={downloadUrl} locale={locale} />);
}
