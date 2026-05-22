// src/pages/TermsOfService.jsx
import React from "react";
import {
  Container,
  Paper,
  Typography,
  Divider,
  Box,
} from "@mui/material";

const TERMS_HTML = `
  <h1>Terms of Service</h1>

  <p><strong>LAST UPDATED:</strong> (insert date)</p>

  <p>
    THIS TERMS OF USE AGREEMENT (THE “AGREEMENT”) ESTABLISHES THE TERMS AND CONDITIONS
    THAT APPLY TO YOU WHEN YOU USE THE SERVICE (AS DEFINED BELOW). BY USING THE SERVICE,
    YOU INDICATE YOUR ACCEPTANCE OF THIS AGREEMENT AND YOUR AGREEMENT TO BE BOUND BY ITS
    TERMS, AS WELL AS ALL APPLICABLE LAWS AND REGULATIONS. IF YOU DO NOT AGREE, DO NOT USE
    THE SERVICE. DOZEMATE PRIVATE LIMITED (“THE COMPANY”, “WE”, “OUR”, OR “US”) MAY MODIFY
    THIS AGREEMENT AT ANY TIME; WE WILL PUBLISH PRIOR NOTICE OF ANY MATERIAL CHANGES.
    YOUR CONTINUED USE OF THE SERVICE AFTER CHANGES MEANS YOU ACCEPT THEM.
  </p>

  <h2>1. Use of Website, Mobile Applications, and Our Service</h2>
  <ol type="a">
    <li>
      The “Service” means Dozemate’s mobile applications and the website located at
      <em>dozemate.com</em>, as each may be updated, relocated, or otherwise modified from time to time,
      including any networks, embeddable widgets, downloadable software, tablet applications,
      and all intellectual property contained therein. The Service provides GPS-GSM devices and
      related services that can provide locations (each, a “Location”) to consumers. Any person who
      accesses and/or uses the Dozemate network to locate a device on their own behalf, or on
      behalf of any third party, is a “Dozemate Member”.
    </li>
    <li>
      The “Service” also includes Dozemate’s IoT devices (wearable or otherwise) used to collect
      personal health and other data for analysis as determined by the Company, with no intention to
      harm any individual directly or indirectly.
    </li>
    <li>
      Subject to this Agreement, the Company grants you a limited, revocable, non-exclusive,
      non-transferable license to access and use the Service, solely as intended by the Company.
      Unless otherwise specified, the Service is for your personal use and not for resale. We may
      (i) restrict or terminate your access to the Service (or any portion), and/or (ii) modify or
      discontinue the Service (or any portion) at any time without notice.
    </li>
    <li>
      Our policy regarding collection and use of personal information is set forth in our
      <strong>Privacy Policy</strong>. By accepting this Agreement, you acknowledge your agreement with
      Dozemate’s Privacy Policy.
    </li>
  </ol>

  <h2>2. Registration, Accounts, Passwords, and Security</h2>
  <ol type="a">
    <li>
      <strong>Dozemate Members.</strong> To become a Dozemate Member, you must complete the registration
      process by providing current, complete, and accurate information as prompted.
    </li>
    <li>
      <strong>Accuracy of Information.</strong> If you provide information that is untrue, inaccurate,
      not current, or incomplete, we may terminate this Agreement and your access to the Service.
    </li>
    <li>
      <strong>Eligibility.</strong> You represent and warrant that you are at least eighteen (18) years of
      age, have not been previously suspended or removed from the Service, and have the legal right
      and ability to enter into this Agreement. If you use the Service on behalf of another person or
      entity, you represent you are authorized to bind that party to this Agreement. THE SERVICE IS
      NOT FOR PERSONS UNDER 13 OR ANY USERS PREVIOUSLY SUSPENDED OR REMOVED. While individuals
      under 18 may use Dozemate devices through the Service via a parent or legal guardian (who must
      supervise the device), such individuals may not use the Service themselves.
    </li>
    <li>
      <strong>Credentials.</strong> You are responsible for maintaining the confidentiality of your
      account and password and for all activities under your account. Notify us immediately of any
      unauthorized use. We are not liable for losses caused by unauthorized use of your account.
      You may be liable for losses incurred by us or others due to such unauthorized use.
    </li>
  </ol>

  <h2>3. Your Responsibilities</h2>
  <p>
    You may use the Service solely for lawful, non-commercial purposes as intended by its
    functionality. You agree not to damage, disable, overburden, or impair the Service or
    interfere with others’ use. Without limitation, you will not (and will not allow or assist
    any third party to):
  </p>
  <ol>
    <li>Use, copy, install, transfer, or distribute the Service except as expressly permitted;</li>
    <li>Modify, adapt, translate, reverse engineer, decompile, or disassemble any portion;</li>
    <li>Remove/alter any copyright, trademark, or proprietary notices;</li>
    <li>Create accounts by automated means or under false pretenses;</li>
    <li>Use robots, spiders, scrapers, site search/retrieval apps, or other automated means;</li>
    <li>Probe/scan/test vulnerabilities or breach security or authentication measures;</li>
    <li>Reformat, mirror, or frame any portion of the Service;</li>
    <li>
      Transmit unlawful, defamatory, obscene, infringing, or otherwise objectionable content,
      or unsolicited commercial communications;
    </li>
    <li>Transmit viruses, worms, Trojan horses, or other harmful code; “data-mine” or circumvent UI;</li>
    <li>Harvest/collect information about users without consent;</li>
    <li>Access non-public areas of the Service or our systems;</li>
    <li>Harass, abuse, or harm others;</li>
    <li>Create a new account if your prior account was disabled without our consent;</li>
    <li>Solicit personal information from other users except as permitted by the Service;</li>
    <li>Restrict or inhibit any person from using the Service; disclose others’ personal info;</li>
    <li>Gain unauthorized access to the Service or connected systems;</li>
    <li>Violate any applicable laws or this Agreement;</li>
    <li>Use the Service to build a competing service.</li>
  </ol>

  <h2>4. Consent to Electronic Communications</h2>
  <ol type="a">
    <li>
      By using the Service or providing Personal Information, you agree we may communicate with you
      electronically regarding security, privacy, and administrative issues. If legally required,
      you may request written (non-electronic) notice by contacting <em>info@dozemate.com</em>.
    </li>
    <li>
      <strong>SMS &amp; Push.</strong> When you register, we may send verification codes and ongoing
      messages/notifications about the Service (including marketing offers, where permitted).
      You can disable push notifications in your device settings.
    </li>
    <li>
      Message delivery depends on your carrier and service. We are not liable for delays or failures.
    </li>
  </ol>

  <h2>5. Content Submitted to the Company</h2>
  <ol type="a">
    <li>
      By sending or posting materials (“Materials”) to the Service, you grant us a worldwide,
      non-exclusive, sublicensable, assignable, royalty-free, perpetual, irrevocable license to use,
      reproduce, distribute, create derivative works, publicly perform and display, and otherwise
      exploit such Materials in any media to enhance and market the Service. We won’t use your name in
      our marketing without your prior consent.
    </li>
    <li>
      We may monitor, alter, remove, and disclose Materials as needed to operate the Service, protect
      ourselves and users, and comply with legal obligations.
    </li>
    <li>
      You represent and warrant you own or control the rights in your Materials; they don’t infringe
      rights of others; they’re free of harmful code; and they don’t contain third-party confidential
      information without authorization.
    </li>
  </ol>

  <h2>6. Term and Termination</h2>
  <ol type="a">
    <li>
      This Agreement starts when you first access the Service and continues while you use it. We may
      take lawful actions for violations, including suspension/termination or blocking access. We may
      disclose information to comply with laws or government requests.
    </li>
    <li>
      Sections that by their nature should survive termination do survive, including (without
      limitation) 1.c, 2.d, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 19–23.
    </li>
  </ol>

  <h2>7. Ownership</h2>
  <ol type="a">
    <li>
      The Service (including content, modifications, enhancements, and updates) and all intellectual
      property rights are owned by the Company and its licensors. The Service is licensed, not sold.
    </li>
    <li>
      We own trademark rights in “Dozemate”™ and other marks displayed in the Service. All third-party
      marks are the property of their respective owners.
    </li>
  </ol>

  <h2>8. Claims of Copyright Infringement</h2>
  <p>
    If you believe materials hosted by us infringe your copyright, send a notice with: (i) your
    signature; (ii) identification of the copyrighted work; (iii) identification of the infringing
    material and its location; (iv) your contact details; (v) a good-faith statement; and
    (vi) a statement under penalty of perjury of your authority. Send notices to:
    <br/><em>Dozemate Private Limited, 429, Sector 11D, Faridabad, Haryana, India.</em>
  </p>

  <h2>9. Disclaimer of Warranty</h2>
  <p>
    THE SERVICE IS PROVIDED “AS IS” WITH ALL FAULTS. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED,
    INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, QUIET ENJOYMENT, ACCURACY, AND
    NON-INFRINGEMENT. WE DO NOT WARRANT THE SERVICE WILL BE UNINTERRUPTED OR SECURE.
  </p>

  <h2>10. Limitation of Liability</h2>
  <ol type="a">
    <li>
      OUR AGGREGATE LIABILITY FOR ANY DAMAGES WILL NOT EXCEED THE AMOUNT YOU PAID FOR THE SERVICE.
      WE WILL NOT BE LIABLE FOR ANY PUNITIVE, SPECIAL, INDIRECT, OR CONSEQUENTIAL DAMAGES.
    </li>
    <li>
      We are not liable for services provided by third parties accessed through the Service.
    </li>
    <li>
      You acknowledge and accept the risks inherent in location services and agree to maintain
      appropriate insurance.
    </li>
  </ol>

  <h2>11. Third-Party Disputes</h2>
  <p>
    Any dispute you have with a carrier, service provider, third-party service, or other third party
    is between you and that party. You release the Company from all claims arising from such disputes.
  </p>

  <h2>12. Force Majeure</h2>
  <p>
    We are not liable for delays or failures due to events beyond our reasonable control.
  </p>

  <h2>13. Indemnification and Release</h2>
  <p>
    You agree to indemnify and hold harmless the Company and its affiliates from claims arising out of
    (i) your breach of this Agreement; (ii) your unauthorized use of the Service; and (iii) claims by
    parties to whom you allow access.
  </p>

  <h2>14. Additional Service Features</h2>
  <p>
    The Service may contain information, products, services, and links provided by third parties. We do
    not control, endorse, or warrant them and may remove links at any time.
  </p>

  <h2>15. Dispute Resolution</h2>
  <ol type="a">
    <li>
      <strong>Mandatory Arbitration.</strong> YOU AND THE COMPANY AGREE TO ARBITRATION (EXCEPT FOR
      SMALL-CLAIMS MATTERS) AS THE EXCLUSIVE FORM OF DISPUTE RESOLUTION FOR ALL DISPUTES ARISING OUT
      OF OR RELATING TO THIS AGREEMENT OR YOUR USE OF THE SERVICE. (Administered in India; English;
      single neutral arbitrator in New Delhi; decision typically within 120 days; confidential.)
    </li>
    <li>
      <strong>No Class Actions.</strong> You may bring claims only in your individual capacity, not as a
      class member or representative.
    </li>
  </ol>

  <h2>16. Governing Law; Choice of Forum</h2>
  <p>
    This Agreement is governed by the laws of the State of New Delhi, excluding its conflict of law rules.
    To the extent any action may be brought in court, the exclusive jurisdiction and venue lie in the
    state and federal courts located in New Delhi, India.
  </p>

  <h2>17. Feedback</h2>
  <p>
    If you send us ideas or suggestions (“Feedback”), the Company will own all rights to the Feedback and
    may use it without obligation or compensation.
  </p>

  <h2>18. Entire Agreement; Variation</h2>
  <p>
    This Agreement constitutes the entire agreement between you and the Company with respect to the
    Service and supersedes all prior or contemporaneous communications.
  </p>

  <h2>19. Severability</h2>
  <p>
    If any provision is held invalid or unenforceable, it will be modified to the minimum extent necessary
    to make it valid and enforceable; the remainder remains in effect.
  </p>

  <h2>20. Relationship of Parties</h2>
  <p>
    Nothing here creates an employer-employee, agency, joint-venture, or partnership relationship.
  </p>

  <h2>21. Waiver</h2>
  <p>
    No failure or delay in exercising any right constitutes a waiver of that right.
  </p>

  <h2>22. Assignment</h2>
  <p>
    You may not assign this Agreement without our prior written consent. We may assign it at any time.
  </p>

  <h2>23. Third-Party Beneficiaries</h2>
  <p>
    The provisions relating to the rights of our content providers are intended for their benefit and are
    enforceable by them.
  </p>

  <hr/>
  <p>
    <strong>Dozemate Private Limited</strong><br/>
    429, Sector 11D, Faridabad, Haryana, India<br/>
    Email: <a href="mailto:info@dozemate.com">info@dozemate.com</a>
  </p>
`;

export default function TermsOfService() {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper elevation={3} sx={{ p: { xs: 3, md: 5 } }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Terms of Service
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Box
          className="terms-content"
          sx={{
            "& h1": { fontSize: "1.75rem", marginTop: 0 },
            "& h2": { fontSize: "1.25rem", marginTop: "1.75rem" },
            "& p": { lineHeight: 1.8, margin: "0.75rem 0" },
            "& ol, & ul": { paddingLeft: "1.25rem", margin: "0.5rem 0 1rem" },
            "& li": { margin: "0.25rem 0" },
            "& hr": { border: 0, height: 1, background: "#eee", margin: "2rem 0" },
            // keep long words from overflowing
            wordBreak: "break-word",
          }}
          dangerouslySetInnerHTML={{ __html: TERMS_HTML }}
        />
      </Paper>
    </Container>
  );
}
