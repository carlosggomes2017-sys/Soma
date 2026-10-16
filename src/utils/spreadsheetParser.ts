import { TitleRecord, PaymentForecastStatus } from '../types';

export function parseBRLValue(raw: string): number {
  if (!raw) return 0;
  // Handle formats like "7.602,40", "-5.801,01", "7602.40"
  const cleaned = raw.replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCNPJ(value: string): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  if (digits.length === 14) {
    return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }
  return value;
}

export function calculateForecastStatus(
  vencimentoStr: string,
  situacaoReceber: string,
  diasAtrasoReport: number,
  today = new Date('2026-10-16T12:00:00')
): { status: PaymentForecastStatus; daysDiff: number } {
  const sit = (situacaoReceber || '').toLowerCase();
  if (sit.includes('tot. receb') || sit.includes('liquidado') || sit.includes('pago') || sit.includes('recebido')) {
    return { status: 'PAGO', daysDiff: 0 };
  }

  // Parse DD/MM/YYYY
  if (vencimentoStr) {
    const parts = vencimentoStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const vencDate = new Date(year, month, day, 12, 0, 0);

      // Difference in days between today and vencDate
      const diffTime = today.getTime() - vencDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 0) {
        return { status: 'EM_ATRASO', daysDiff: diffDays };
      } else {
        return { status: 'NO_PRAZO', daysDiff: Math.abs(diffDays) };
      }
    }
  }

  if (diasAtrasoReport > 0) {
    return { status: 'EM_ATRASO', daysDiff: diasAtrasoReport };
  }

  return { status: 'NO_PRAZO', daysDiff: 0 };
}

export function parseRelTitulosAPagar(csvContent: string): TitleRecord[] {
  const lines = csvContent.split(/\r?\n/);
  const records: TitleRecord[] = [];

  let headerIndex = -1;
  let headers: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('FORNECEDOR REPRESENTANTE') && line.includes('DATA DE VENCIMENTO')) {
      headerIndex = i;
      headers = line.split(';').map((h) => h.trim().toUpperCase());
      break;
    }
  }

  // Column index finders
  const getColIdx = (nameMatches: string[]): number => {
    return headers.findIndex((h) =>
      nameMatches.some((match) => h.includes(match.toUpperCase()))
    );
  };

  const fornecedorIdx = getColIdx(['FORNECEDOR REPRESENTANTE']);
  const cnpjIdx = getColIdx(['CNPJ FORNECEDOR REPRESENTANTE']);
  const docIdx = getColIdx(['NÚMERO DO DOCUMENTO', 'NUMERO DO DOCUMENTO']);
  const nfeIdx = getColIdx(['NF-E']);
  const clienteIdx = getColIdx(['CLIENTE']);
  const filialIdx = getColIdx(['NOME']); // Filial name usually after CÓDIGO FILIAL
  const emissaoIdx = getColIdx(['DATA DE EMISSÃO', 'DATA DE EMISSAO']);
  const vencimentoIdx = getColIdx(['DATA DE VENCIMENTO']);
  const valorIdx = getColIdx(['VALOR']);
  const diasAtrasoIdx = getColIdx(['DIAS EM ATRASO']);
  const situacaoIdx = getColIdx(['SITUAÇÃO DO CONTAS A RECEBER', 'SITUACAO DO CONTAS A RECEBER']);
  const campanhaIdx = getColIdx(['CAMPANHA']);
  const bancoIdx = getColIdx(['BANCO DO TERCEIRO']);
  const agenciaIdx = getColIdx(['AGÊNCIA DO TERCEIRO', 'AGENCIA DO TERCEIRO']);
  const contaIdx = getColIdx(['CONTA CORRENTE DO TERCEIRO']);

  const startLine = headerIndex >= 0 ? headerIndex + 1 : 0;

  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('*') || line.startsWith(';Filtros:')) continue;

    const cols = line.split(';');
    if (cols.length < 5) continue;

    const fornecedorNome = (fornecedorIdx >= 0 ? cols[fornecedorIdx] : cols[4])?.trim() || '';
    if (!fornecedorNome || fornecedorNome.startsWith('REL') || fornecedorNome === 'NOME') continue;

    const fornecedorCnpj = (cnpjIdx >= 0 ? cols[cnpjIdx] : '')?.trim() || '';
    const numeroDocumento = (docIdx >= 0 ? cols[docIdx] : cols[12])?.trim() || '';
    const nfe = (nfeIdx >= 0 ? cols[nfeIdx] : '')?.trim() || '';
    const clienteNome = (clienteIdx >= 0 ? cols[clienteIdx] : cols[6])?.trim() || '';
    const dataEmissao = (emissaoIdx >= 0 ? cols[emissaoIdx] : cols[16])?.trim() || '';
    const dataVencimento = (vencimentoIdx >= 0 ? cols[vencimentoIdx] : cols[17])?.trim() || '';
    const valorRaw = (valorIdx >= 0 ? cols[valorIdx] : cols[20])?.trim() || '0';
    const diasAtrasoRaw = (diasAtrasoIdx >= 0 ? cols[diasAtrasoIdx] : cols[19])?.trim() || '0';
    const situacaoOriginal = (situacaoIdx >= 0 ? cols[situacaoIdx] : '')?.trim() || 'Em aberto';

    const valor = parseBRLValue(valorRaw);
    const diasAtrasoReport = parseInt(diasAtrasoRaw, 10) || 0;

    const { status, daysDiff } = calculateForecastStatus(
      dataVencimento,
      situacaoOriginal,
      diasAtrasoReport
    );

    const record: TitleRecord = {
      id: `TIT-${i}-${numeroDocumento || Math.floor(Math.random() * 10000)}`,
      fornecedorNome,
      fornecedorCnpj,
      numeroDocumento: numeroDocumento || nfe || '—',
      nfe: nfe || numeroDocumento || '—',
      clienteNome: clienteNome || 'Artplan Comunicação',
      empresaNome: 'Artplan Comunicação Ltda.',
      filialNome: cols[3]?.trim() || 'ART - Geral',
      dataEmissao,
      dataVencimento,
      valor,
      diasAtraso: status === 'EM_ATRASO' ? (daysDiff || diasAtrasoReport) : 0,
      situacaoOriginal,
      statusPrevisao: status,
      campanha: (campanhaIdx >= 0 ? cols[campanhaIdx] : '')?.trim(),
      banco: (bancoIdx >= 0 ? cols[bancoIdx] : '')?.trim(),
      agencia: (agenciaIdx >= 0 ? cols[agenciaIdx] : '')?.trim(),
      conta: (contaIdx >= 0 ? cols[contaIdx] : '')?.trim(),
    };

    records.push(record);
  }

  return records;
}
