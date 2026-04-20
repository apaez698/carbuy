import KpiGrid from '../components/KpiGrid.jsx';
import LeadsDiaChart from '../components/charts/LeadsDiaChart.jsx';
import MarcasChart from '../components/charts/MarcasChart.jsx';
import CiudadesChart from '../components/charts/CiudadesChart.jsx';
import ScrollChart from '../components/charts/ScrollChart.jsx';

export default function OverviewPage({ password }) {
  return (
    <>
      <KpiGrid password={password} />
      <LeadsDiaChart password={password} />
      <MarcasChart password={password} />
      <CiudadesChart password={password} />
      <ScrollChart password={password} />
    </>
  );
}
