import { Pipe, PipeTransform } from '@angular/core';
/*
 * Format CPF or CNPJ
 * If the value is different from CPF or CNPJ value length, it will return the value itself without formatting.
 * Usage:
 *   value | cpfCnpj
 * Example:
 *   {{ 15605198000104 | cpfCnpj }}
 *   formats to: 15.605.198/0001-04
*/
@Pipe({
    name: 'cpfCnpjMask'
})
export class CpfCnpjPipe implements PipeTransform {
    public transform(value: string = ''): string {
        let newVal: string = value?.replace(/\D/g, '');
        if (newVal?.length === 11) {
            return newVal?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        } else if (newVal?.length === 14) {
            return newVal?.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
        }
        return value;
    }
}