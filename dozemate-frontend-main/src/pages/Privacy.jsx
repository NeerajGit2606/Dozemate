// src/pages/PrivacyPolicy.jsx
import React, { useEffect } from "react";
import { Container, Paper, Typography, Divider, Box } from "@mui/material";

const PRIVACY_HTML = `
  <h1>Privacy Policy</h1>
  <p><strong>LAST UPDATED:</strong> (insert date)</p>

  <p>
    This Privacy Policy applies to users of the Dozemate™ products and applications.
    Dozemate Private Limited, an Indian company, is the developer and owner of commercial
    rights to applications and products sold under the Dozemate™ brand, including (without
    limitation) Slimring, Dozemate, Hexaskin, Dozemate Walk, Dozemate PPG, Dozemate ECG,
    Dozemate HRV and others.
  </p>

  <p>
    Dozemate Private Limited (“we”, “our”, “Dozemate” or “the Company”) has updated this
    privacy policy to include additional information required under applicable data
    protection regulations, including:
  </p>
  <ul>
    <li>Why we process personal data</li>
    <li>Legal grounds for processing personal data</li>
    <li>Contact information for Dozemate data controllers</li>
    <li>Contact information for the Dozemate Data Protection Officer in India</li>
  </ul>

  <h2>1) Categories of Personal Data We Process</h2>

  <h3>1.1 When you create a Dozemate account</h3>
  <p>
    When you create a Dozemate account, we ask for your email address and name. You may
    provide only a first name or nickname instead of your full name.
  </p>
  <p><strong>Purposes and legal grounds</strong></p>
  <ol type="a">
    <li>
      We process your email address because you use it (along with your password) to sign in
      to your account. The legal ground is our legitimate interest in protecting your account’s
      security.
    </li>
    <li>
      We process your email address to send important information about your Dozemate products,
      apps or account (e.g., safety information or material changes to this Privacy Policy).
      Your name is associated with your profile and may display when you submit content on a
      Dozemate website or app. The legal ground is our legitimate interest in providing such
      information and enabling engagement with other users.
    </li>
    <li>
      If you opt in to marketing, we process your email to send marketing about Dozemate
      products and apps. The legal ground is consent. You can withdraw consent at any time via
      your account preferences or the unsubscribe link in our emails. We tailor emails based on
      your preferences, IP locale, devices added to your account, and subscriptions—our
      legitimate interest is to reduce irrelevant marketing.
    </li>
    <li>
      We process your email while assisting you via customer support. The legal ground is our
      legitimate interest in providing quality support.
    </li>
  </ol>

  <h3>1.2 Social sign-in (if you choose)</h3>
  <p>
    You may sign in with social media credentials (e.g., Facebook). The first time, the social
    provider may offer to share information (name, email, profile photo, posts, comments, etc.).
    Dozemate only retains and processes your email address. If you do not want the social
    provider to share information, sign in using your Dozemate credentials instead.
  </p>
  <p><strong>Purpose and legal ground:</strong> We associate the social email with your Dozemate
  account so you can later sign in with email/password. The legal ground is our legitimate
  interest in offering an alternative sign-in and securing your account.</p>

  <h3>1.3 When you sync your Dozemate device</h3>
  <p>
    We log technical data about transmissions, such as IP address used during sync, sync time
    and date, crash/diagnostic logs, device location, device/network details (Wi-Fi or cellular),
    and battery level.
  </p>
  <p><strong>Purpose and legal ground:</strong> To identify and resolve errors or syncing issues—our
  legitimate interest in providing quality product support.</p>

  <h3>1.4 When you communicate with Dozemate</h3>
  <p>
    When you contact support via email, phone, online or in person, we collect personal data
    (name, address, phone, email, contact preferences) and information about your Dozemate
    products (e.g., device ID, purchase date). We may create diagnostic logs and capture details
    related to your support issue. Subject to law, we may record and review conversations or
    analyze feedback from voluntary surveys. With your consent, support agents may sign in to
    your account (if appropriate) to troubleshoot.
  </p>
  <p><strong>Purpose and legal ground:</strong> To provide and improve support (legitimate interest).
  Signing into your account to troubleshoot is based on your consent, which you may withdraw.</p>

  <h3>1.5 Location and telemetry from your device/app (with consent)</h3>
  <p>
    If you use a Dozemate device or app and provide consent, Dozemate may collect and upload
    data such as location, speed, direction, and timestamps. With consent, we may share or sell
    aggregated data with third parties to improve features (e.g., traffic/parking).
  </p>
  <p><strong>Purpose and legal ground:</strong> To enhance product/app quality and features. The legal
  ground is consent, which you may withdraw in your device/app settings at any time.</p>

  <h3>1.6 Purchases on a Dozemate website</h3>
  <p>
    If you purchase on a Dozemate site, we collect your name, mailing address, and phone number.
    We do not view or store your payment card information—it is handled by a third party.
  </p>
  <p><strong>Purpose and legal grounds:</strong> To process and fulfill your order (performance of a
  contract) and to detect fraud (legitimate interest in protecting customers and Dozemate).</p>

  <h2>2) Categories of Recipients</h2>

  <h3>2.1 Friends / invitees</h3>
  <p>
    Some Dozemate devices let you share a link so chosen people can view your device’s
    real-time location. Anyone with the link can view the location, so share only with people
    you trust.
  </p>

  <h3>2.2 Service providers</h3>
  <p>
    We use third-party cloud and logistics providers (e.g., for email delivery tracking,
    engagement analytics, and shipping). These providers process data on our behalf.
  </p>

  <h3>2.3 Other disclosures</h3>
  <p>We may disclose personal data:</p>
  <ul>
    <li>With your valid consent;</li>
    <li>To comply with a subpoena, court/administrative order, legal process, or obligation;</li>
    <li>To enforce our terms/policies;</li>
    <li>As necessary to pursue legal remedies or defend legal claims.</li>
  </ul>
  <p>
    We may also transfer personal data to an affiliate, subsidiary, or third party in the event of
    reorganization, merger, sale, joint venture, assignment or other disposition of all/part of
    Dozemate’s business or assets (including bankruptcy). Any recipient must process personal data
    only as described in this Privacy Policy and, where required, after providing notice and
    obtaining consent.
  </p>

  <h2>3) International Transfers</h2>
  <p>
    Dozemate is a global business. To provide products, apps, and services, we may transfer your
    personal data to other Dozemate entities in other countries. Depending on your device
    configuration, data may be stored on servers in India, the United States, or Europe. Where
    required, transfers occur subject to appropriate safeguards (e.g., approved Model Contractual
    Clauses). All Dozemate companies follow the privacy practices in this Policy.
  </p>

  <h2>4) Cookies and Similar Technologies</h2>

  <h3>4.1 Websites</h3>
  <p>
    With help from third-party analytics providers, we collect certain information when you visit
    our sites: IP address, device location, browser type/language, request date/time, visit times,
    page views, and clicked elements. We may use cookies, pixel tags, web beacons, clear GIFs, and
    similar tools to analyze usage, measure ads, fix problems, and improve your experience. We may
    engage providers to present online ads on our behalf using similar technologies.
  </p>
  <p>
    Most browsers allow you to decline or control these technologies. In regions where consent is
    required for non-essential cookies, you can manage preferences on our sites (note: certain
    cookies are required for core functionality).
  </p>

  <h3>4.2 Dozemate mobile apps</h3>
  <p>
    We collect analytics data about app usage (e.g., the date/time the app accesses our servers,
    app version, device location, language, downloaded content, features used, frequency of use,
    device state, model/OS, and app performance). We use this to improve quality and functionality,
    develop and market features, and diagnose stability/usability issues as quickly as possible.
  </p>
  <p><strong>Legal ground:</strong> Our legitimate interest in understanding usage to enhance the user
  experience.</p>
  <p><strong>Examples of providers:</strong></p>
  <ul>
    <li>
      <em>Google</em> — Google Analytics for site statistics and user demographics/interests/behavior;
      Google Search Console for SEO insights. See Google’s documentation for data controls and
      opt-out options for Google Analytics.
    </li>
    <li>
      <em>Application Performance Monitoring</em> — Tools that receive basic request information
      (including IP address) to detect/diagnose errors and response times.
    </li>
    <li>
      <em>Social networks</em> — Plug-ins/features (e.g., Facebook/Google sign-in, “Like” buttons)
      may use cookies or beacons to gather data about your use of our websites/apps. Their use of
      data is governed by their privacy policies. We may also receive aggregate analytics from social
      networks (e.g., impressions/clicks) to measure content/ad effectiveness.
    </li>
  </ul>

  <h2>5) Children</h2>
  <p>
    Dozemate devices are not intended to be purchased by anyone under 13. Where a parent/legal
    guardian purchases a device to locate a child, any personal information transmitted to
    Dozemate is deemed to be the parent’s information. We do not knowingly collect personal data
    from children under 13. If we become aware that we have collected personal data from a child
    under 13, we will delete it as quickly as possible. If you believe we might have such data,
    contact <a href="mailto:support@dozemate.com">support@dozemate.com</a>.
  </p>

  <h2>6) Updates to This Policy</h2>
  <p>
    We may update this Privacy Policy as we add products/apps, improve offerings, or when laws and
    technologies change. The “Last updated” date at the top indicates the latest revision. Changes
    are effective upon posting. If changes are material, we will notify you and, where required,
    obtain consent (e.g., via email or notice on Dozemate sites/apps that link to this Policy).
  </p>

  <h2>7) Retention</h2>
  <p>
    We retain your personal data as long as your Dozemate account remains active. See “Your Rights”
    for information about your right of erasure.
  </p>

  <h2>8) Data Controller &amp; Data Protection Officer</h2>
  <p>
    If you reside in the Indian sub-continent, EEA, or USA, your personal data collected by
    Dozemate is controlled by:
  </p>
  <p>
    <strong>Dozemate Private Limited</strong><br/>
    429, Sector 11D, Faridabad, Haryana, India
  </p>

  <h2>9) Your Rights</h2>
  <p>
    Subject to applicable law (e.g., GDPR), you may request access, rectification, erasure, data
    portability, restriction of processing, or object to processing. You also have the right to
    lodge a complaint with a supervisory authority.
  </p>
  <p>
    To exercise access/rectification/portability/erasure or to delete your Dozemate account, email
    <a href="mailto:info@dozemate.com">info@dozemate.com</a> with your account email and the device
    ID(s) of your Dozemate devices. To exercise restriction or objection, contact our Data
    Protection Officer at <a href="mailto:info@dozemate.com">info@dozemate.com</a>.
  </p>
`;

export default function PrivacyPolicy() {
  useEffect(() => window.scrollTo(0, 0), []);
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper elevation={3} sx={{ p: { xs: 3, md: 5 } }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dozemate — Privacy Policy
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Box
          sx={{
            "& h1": { fontSize: "1.75rem", marginTop: 0 },
            "& h2": { fontSize: "1.25rem", marginTop: "1.75rem" },
            "& h3": { fontSize: "1.1rem", marginTop: "1.25rem" },
            "& p": { lineHeight: 1.8, margin: "0.75rem 0" },
            "& ol, & ul": { paddingLeft: "1.25rem", margin: "0.5rem 0 1rem" },
            "& li": { margin: "0.25rem 0" },
            wordBreak: "break-word",
          }}
          dangerouslySetInnerHTML={{ __html: PRIVACY_HTML }}
        />
      </Paper>
    </Container>
  );
}
