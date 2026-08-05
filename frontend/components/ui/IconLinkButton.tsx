import { ArrowUpRight, LucideIcon } from 'lucide-react';

interface IconLinkButtonProps {
  href: string;
  label: string;
  external?: boolean;
  icon?: LucideIcon;
}

export default function IconLinkButton({ href, label, external = true, icon: Icon = ArrowUpRight }: IconLinkButtonProps) {
  return (
    <a
      href={href}
      aria-label={label}
      className="icon-link-btn"
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      <Icon className="w-3.5 h-3.5" />
    </a>
  );
}
