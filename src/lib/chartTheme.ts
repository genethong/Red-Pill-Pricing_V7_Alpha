export const CHART_SERIES = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
] as const;

export const chartGrid = 'var(--chart-grid)';
export const chartAxis = 'var(--chart-axis)';

export const chartTooltipStyle: Record<string, string | number> = {
  backgroundColor: 'var(--bg-elevated)',
  border: '0.5px solid var(--separator)',
  borderRadius: 12,
  color: 'var(--label)',
  fontSize: 12,
  boxShadow: 'var(--shadow-menu)',
};

export const chartTooltipLabelStyle: Record<string, string | number> = {
  color: 'var(--label-secondary)',
  fontWeight: 600,
  fontSize: 11,
  margin: '0 0 4px 0',
};
