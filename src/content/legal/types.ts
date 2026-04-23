import type { ReactNode } from "react";

export interface LegalSection {
  n: string;
  id: string;
  title: string;
  body: ReactNode;
}

export interface LegalDocument {
  title: string;
  lastUpdated: string;
  version: string;
  idPrefix: string;
  sections: LegalSection[];
}
