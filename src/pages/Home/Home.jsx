import css from './Home.module.css';

const Home = () => {
  return (
    <div className={css.container}>
      <img src="/logo.png" alt="Golden Snack logo" className={css.logo} />
      <h1 className={css.title}>Konfigurátor Golden Snack</h1>
      <p className={css.subtitle}>
        Přizpůsobte parametry stroje podle svých potřeb.
      </p>
    </div>
  );
};

export default Home;
