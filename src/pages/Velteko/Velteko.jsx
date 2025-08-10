import dataVelteko from '../../data/velteko.json';
import VeltekoList from '../../components/VeltekoList/VeltekoList';

const Velteko = () => {
  return (
    <>
      <VeltekoList data={dataVelteko} />
    </>
  );
};

export default Velteko;
