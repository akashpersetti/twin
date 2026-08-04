import { ArrowUpRight } from 'lucide-react';

interface IconLinkButtonProps {
  href: string;
  label: string;
  external?: boolean;
}

export default function IconLinkButton({ href, label, external = true }: IconLinkButtonProps) {
  return (
    <a
      href={href}
      aria-label={label}
      className="icon-link-btn"
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      <ArrowUpRight className="w-3.5 h-3.5" />
    </a>
  );
}
