import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import FunnelChart from './FunnelChart.jsx';

vi.mock('../hooks/useMetric.js', () => ({
  default: vi.fn(),
}));

import useMetric from '../hooks/useMetric.js';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const mockFunnelData = {
  data: [
    { event_type: 'step_start', step: 1 },
    { event_type: 'step_start', step: 1 },
    { event_type: 'step_start', step: 1 },
    { event_type: 'step_start', step: 2 },
    { event_type: 'step_start', step: 2 },
    { event_type: 'step_start', step: 3 },
    { event_type: 'form_submit' },
    { event_type: 'whatsapp_click' },
  ],
};

describe('FunnelChart', () => {
  it('shows loading state', () => {
    useMetric.mockReturnValue({ data: null, isLoading: true });

    render(<FunnelChart password="secret" />);

    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('renders all 5 funnel steps', () => {
    useMetric.mockReturnValue({ data: mockFunnelData, isLoading: false });

    render(<FunnelChart password="secret" />);

    expect(screen.getByText('1. Datos del auto')).toBeInTheDocument();
    expect(screen.getByText('2. Estado y extras')).toBeInTheDocument();
    expect(screen.getByText('3. Datos contacto')).toBeInTheDocument();
    expect(screen.getByText('✅ Formulario enviado')).toBeInTheDocument();
    expect(screen.getByText('💬 Click WhatsApp')).toBeInTheDocument();
  });

  it('step 1 shows 100%', () => {
    useMetric.mockReturnValue({ data: mockFunnelData, isLoading: false });

    render(<FunnelChart password="secret" />);

    const spans = screen.getAllByText(/100%/);
    expect(spans.some((el) => el.textContent.includes('3'))).toBe(true);
  });

  it('renders section id section-funnel', () => {
    useMetric.mockReturnValue({ data: mockFunnelData, isLoading: false });

    render(<FunnelChart password="secret" />);

    expect(document.getElementById('section-funnel')).not.toBeNull();
  });

  it('handles empty data without crashing', () => {
    useMetric.mockReturnValue({ data: { data: [] }, isLoading: false });

    render(<FunnelChart password="secret" />);

    expect(screen.getByText('1. Datos del auto')).toBeInTheDocument();
  });

  it('handles null metric payload without crashing', () => {
    useMetric.mockReturnValue({ data: null, isLoading: false });

    render(<FunnelChart password="secret" />);

    expect(screen.getByText('1. Datos del auto')).toBeInTheDocument();
  });
});
