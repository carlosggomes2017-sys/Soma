export type PaymentForecastStatus = 'NO_PRAZO' | 'EM_ATRASO' | 'PAGO';

export interface TitleRecord {
  id: string;
  fornecedorNome: string;
  fornecedorCnpj: string;
  numeroDocumento: string;
  nfe: string;
  clienteNome: string;
  empresaNome: string;
  filialNome: string;
  dataEmissao: string;
  dataVencimento: string;
  valor: number;
  diasAtraso: number;
  situacaoOriginal: string; // "Em aberto", "Tot. receb.", etc.
  statusPrevisao: PaymentForecastStatus;
  campanha?: string;
  banco?: string;
  agencia?: string;
  conta?: string;
}
