import dataVelteko from '../../data/velteko.json';
import VeltekoList from '../../components/VeltekoList/VeltekoList';
import { useProductionCards } from '../../production/useProductionCards';

const Velteko = () => {
  const { cards } = useProductionCards('velteko', dataVelteko);

  return <VeltekoList data={cards} />;
};

export default Velteko;
