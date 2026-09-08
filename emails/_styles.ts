import type { CSSProperties } from "react";

const fontFamily =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

export const main: CSSProperties = {
  backgroundColor: "#f4f4f5",
  fontFamily,
  padding: "24px 0",
};

export const container: CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px",
  maxWidth: "480px",
  borderRadius: "12px",
  border: "1px solid #e4e4e7",
};

export const h1: CSSProperties = {
  color: "#18181b",
  fontSize: "22px",
  fontWeight: 600,
  margin: "0 0 16px",
};

export const text: CSSProperties = {
  color: "#3f3f46",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

export const muted: CSSProperties = {
  color: "#a1a1aa",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "16px 0 0",
};

export const button: CSSProperties = {
  backgroundColor: "#18181b",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: 600,
  textDecoration: "none",
  padding: "12px 24px",
  display: "inline-block",
};

export const link: CSSProperties = {
  color: "#18181b",
  fontSize: "13px",
  textDecoration: "underline",
  wordBreak: "break-all",
};
