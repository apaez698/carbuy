import FunnelChart from '../components/FunnelChart.jsx';
import LeadsTable from '../components/LeadsTable.jsx';

export default function LeadsFunnelPage({ password, mode }) {
  if (mode === 'funnel') {
    return <FunnelChart password={password} />;
  }

  return <LeadsTable password={password} />;
}
