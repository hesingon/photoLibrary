export interface IUserStats {
  complete_revision_count: number;
  start_revision_count: number;
  tap_pn_count: number;
  receive_pn_count: number;
}

export interface IMetric {
  name: string;
  value: number;
  description?: string;
  unit?: string;
  color?: string;
}
