import dataButler from '../../data/butler.json';
import ButlerList from '../../components/ButlerList/ButlerList';

const Butler = () => {
  return (
    <>
      <ButlerList data={dataButler} />
    </>
  );
};

export default Butler;
