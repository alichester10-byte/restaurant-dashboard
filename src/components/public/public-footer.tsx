import { buildPublicHref, getPublicCopy, type PublicLanguage } from "@/lib/public-site";

export function PublicFooter({ language }: { language: PublicLanguage }) {
  const copy = getPublicCopy(language);

  const footerLinks = [
    { href: "/about", label: copy.nav.about },
    { href: "/privacy", label: copy.nav.privacy },
    { href: "/terms", label: copy.nav.terms }
  ];

  return (
    <footer className="border-t border-black/5 bg-[#f4ecde]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-10 md:flex-row md:items-end md:justify-between md:px-10">
        <div className="max-w-xl">
          <div className="text-xs font-semibold uppercase tracking-[0.35em] text-sage">Limon Masa</div>
          <div className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-moss">
            {copy.footer.marker}
          </div>
          <p className="mt-3 text-sm leading-7 text-sage">{copy.footer.blurb}</p>
          <a className="mt-4 inline-block text-sm font-medium text-ink transition hover:text-moss" href="mailto:info@limonmasa.com">
            info@limonmasa.com
          </a>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-sage">
          {footerLinks.map((link) => (
            <a key={link.href} href={buildPublicHref(link.href, language)} className="transition hover:text-ink">
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
