#!/usr/bin/env bun

import {
  assertWebsiteSpecComplianceRegistry,
  generateWebsiteSpecAuditMarkdown,
} from "../lib/scaffold/website-spec-compliance";

assertWebsiteSpecComplianceRegistry();
console.log(generateWebsiteSpecAuditMarkdown());
