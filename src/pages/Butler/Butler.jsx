import dataButler from '../../data/butler.json';
import ButlerList from '../../components/ButlerList/ButlerList';
import { useProductionCards } from '../../production/useProductionCards';

const Butler = () => {
  const { cards } = useProductionCards('butler', dataButler);

  return <ButlerList data={cards} />;
};

export default Butler;
