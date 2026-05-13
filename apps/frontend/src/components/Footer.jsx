const footerLinks = [
  {
    title: "About",
    url: "#",
  },
  {
    title: "Contact",
    url: "#",
  },
];

const Footer = () => {
  return (
    <footer className="border-t border-slate-800 bg-background/80 backdrop-blur-md py-6 md:py-0">
      <div className="container mx-auto px-4 min-h-[4rem] flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
        <p className="text-sm md:text-md text-muted-foreground text-center md:text-left">
          &copy; {new Date().getFullYear()} BlogAI. All rights reserved.
        </p>
        <p className="text-sm md:text-md text-muted-foreground text-center">
          Made with ❤️ by{" "}
          <a
            href="https://www.sudev.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-bold underline cursor-pointer hover:text-primary/80 transition-colors"
          >
            Sudev
          </a>
        </p>
        <div className="flex items-center space-x-6">
          {footerLinks.map((footerLink) => (
            <a
              key={footerLink.title}
              href={footerLink.url}
              className="text-sm md:text-md text-secondary hover:text-primary transition-colors duration-200"
            >
              {footerLink.title}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
