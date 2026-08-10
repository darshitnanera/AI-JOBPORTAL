// Footer.jsx
import React from "react";
import {
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Building,
  Briefcase,
  Users,
  Award,
  Shield,
  UserCog,
  Bookmark,
  UserPen,
} from "lucide-react";
import Companylogo from "../../assets/hexagonlogo.png";
import logo from "../../assets/logo.png";
import { footerStyles as s } from "../../assets/dummyStyles";

const Footer = () => {
  return (
    <footer className={s.footer}>
      <div className={s.footerInner}>
        {/* Main Footer Content */}
        <div className={s.grid}>
          {/* Company Info */}
          <div className={s.companySection}>
            <div className={s.logoWrapper}>
              <a href="/" aria-label="JobPortal home" className={s.logoLink}>
                <img src={logo} alt="JobPortal Logo" className={s.logoImage} />
              </a>
              <div>
                <h2 className={s.companyTitle}>JobPortal</h2>
                <p className={s.companyTagline}>Find Your Dream Job</p>
              </div>
            </div>
            <p className={s.companyDescription}>
              Connecting talented professionals with top companies worldwide.
              Your career journey starts here.
            </p>
            <div className={s.socialIconsContainer}>
              <SocialIcon
                href="#"
                icon={<Linkedin className="w-4 h-4 sm:w-5 sm:h-5" />}
                label="LinkedIn"
              />
              <SocialIcon
                href="#"
                icon={<Twitter className="w-4 h-4 sm:w-5 sm:h-5" />}
                label="Twitter"
              />
              <SocialIcon
                href="#"
                icon={<Facebook className="w-4 h-4 sm:w-5 sm:h-5" />}
                label="Facebook"
              />
              <SocialIcon
                href="#"
                icon={<Instagram className="w-4 h-4 sm:w-5 sm:h-5" />}
                label="Instagram"
              />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className={s.sectionHeader}>Quick Links</h3>
            <ul className={s.linkList}>
              <FooterLink
                href="/jobs"
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Find Jobs
              </FooterLink>
              <FooterLink
                href="/companies"
                icon={<Building className="w-4 h-4" />}
              >
                Companies
              </FooterLink>
              <FooterLink href="/roles" icon={<UserCog className="w-4 h-4" />}>
                Roles
              </FooterLink>
              <FooterLink href="/saved" icon={<Bookmark className="w-4 h-4" />}>
                Saved
              </FooterLink>
              <FooterLink
                href="/contact"
                icon={<UserPen className="w-4 h-4" />}
              >
                Contact
              </FooterLink>
            </ul>
          </div>

          {/* For Employers */}
          <div>
            <h3 className={s.sectionHeader}>For Employers</h3>
            <ul className={s.linkList}>
              <FooterLink href="/" icon={<ArrowRight className="w-4 h-4" />}>
                Post a Job
              </FooterLink>
              <FooterLink href="/" icon={<Award className="w-4 h-4" />}>
                Pricing
              </FooterLink>
              <FooterLink href="/" icon={<Users className="w-4 h-4" />}>
                Recruitment Solutions
              </FooterLink>
              <FooterLink href="/" icon={<Briefcase className="w-4 h-4" />}>
                Employer Dashboard
              </FooterLink>
              <FooterLink href="/" icon={<Shield className="w-4 h-4" />}>
                Employer Branding
              </FooterLink>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className={s.sectionHeader}>Contact Us</h3>
            <div className={s.contactList}>
              <ContactItem
                icon={<Mail className="w-4 h-4 sm:w-5 sm:h-5" />}
                text="support@jobportal.com"
                href="mailto:support@jobportal.com"
              />
              <ContactItem
                icon={<Phone className="w-4 h-4 sm:w-5 sm:h-5" />}
                text="+1 (555) 123-4567"
                href="tel:+15551234567"
              />
              <ContactItem
                icon={<MapPin className="w-4 h-4 sm:w-5 sm:h-5" />}
                text="123 Career Street, San Francisco, CA"
              />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className={s.divider} />

        {/* Bottom Footer */}
        <div className={s.bottomFooter}>
          <img
            src={Companylogo}
            alt="Hexagon Digital Services"
            className={s.bottomLogo}
          />
          <span className={s.designedByText}>Designed by</span>
          <a
            href="https://hexagondigitalservices.com"
            target="_blank"
            rel="noopener noreferrer"
            className={s.designedByLink}
          >
            Hexagon Digital Services
          </a>
        </div>
      </div>
    </footer>
  );
};

// Social Icon Component
const SocialIcon = ({ href, icon, label }) => (
  <a href={href} aria-label={label} className={s.socialIcon}>
    {icon}
  </a>
);

// Footer Link Component
const FooterLink = ({ href, children, icon }) => (
  <li>
    <a href={href} className={s.footerLinkItem}>
      <span className={s.footerLinkIcon}>{icon}</span>
      <span className={s.footerLinkText}>{children}</span>
    </a>
  </li>
);

// Contact Item Component
const ContactItem = ({ icon, text, href }) => (
  <div className={s.contactItemContainer}>
    <div className={s.contactIconWrapper}>{icon}</div>
    {href ? (
      <a href={href} className={s.contactText}>
        {text}
      </a>
    ) : (
      <span className={s.contactTextNoLink}>{text}</span>
    )}
  </div>
);

// Stat Item Component (kept for compatibility; not used in layout)
const StatItem = ({ number, label }) => (
  <div className={s.statItem}>
    <div className={s.statNumber}>{number}</div>
    <div className={s.statLabel}>{label}</div>
  </div>
);

export default Footer;
