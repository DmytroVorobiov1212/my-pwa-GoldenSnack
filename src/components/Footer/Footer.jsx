import s from './Footer.module.css';
const Footer = () => {
  return (
    <>
      <footer className={s.footer}>
        <div className={s.container}>
          <img
            src="/logo-devCraft.jpg"
            alt="Dmytro DevCraft logo"
            className={s.logo}
          />
          <p className={s.text}>
            © {new Date().getFullYear()} Dmytro Vorobiov. Všechna práva
            vyhrazena.
          </p>
        </div>
      </footer>
    </>
  );
};

export default Footer;
