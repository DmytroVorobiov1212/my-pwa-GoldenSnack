import ButlerList from '../../components/ButlerList/ButlerList';
import { useProductionCards } from '../../production/useProductionCards';

const Masek = () => {
  const { cards } = useProductionCards('masek', [], { allowEmptyServer: true });

  return <ButlerList data={cards} />;
};

export default Masek;
