/** CONTRATO PENDENTE: formato de listagem paginada esperado do backend. */
export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}
