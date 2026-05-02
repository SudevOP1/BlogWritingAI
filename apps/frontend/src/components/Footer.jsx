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
    <footer className="border-t border-slate-800 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <p className="text-md text-muted-foreground">&copy; {new Date().getFullYear()} BlogAI. All rights reserved.</p>
        <p className="text-md text-muted-foreground">
          Made with ❤️ by{" "}
          <a
            href="https://www.sudev.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-bold underline cursor-pointer"
          >
            Sudev
          </a>
        </p>
        <div className="flex items-center space-x-4">
          {footerLinks.map((footerLink) => (
            <a
              key={footerLink.title}
              href={footerLink.url}
              className="text-md text-secondary hover:text-primary transition-colors duration-200"
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
