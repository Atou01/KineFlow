export function nextInvoiceNumber(prefix:string, date=new Date(), seq:number){
  const yyyy = date.getFullYear();
  const pad = String(seq).padStart(4, '0');
  return `${prefix}${yyyy}-${pad}`;
}
