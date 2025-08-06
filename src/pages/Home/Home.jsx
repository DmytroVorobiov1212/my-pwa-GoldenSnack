import css from './Home.module.css';

const Home = () => {
  return (
    <div className={css.container}>
      <img src="/logo.png" alt="Golden Snack logo" className={css.logo} />
      <h1 className={css.title}>Vítejte v konfigurátoru Golden Snack</h1>
      <p className={css.subtitle}>
        Vyberte si stroj, který chcete upravit nebo prozkoumat.
      </p>
    </div>
  );
};

export default Home;
