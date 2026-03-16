import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class WalletUtilsService {

    /**
     * Checks whether the given address is valid for the specified network
     * @param address Endereço da carteira
     * @param network Rede da carteira ('eth' | 'tron' | 'btc')
     */
    public checkAddress(address: string, network: 'eth' | 'tron' | 'btc'): boolean {
        switch (network) {
            case 'eth':
                return this.isValidEthereum(address);
            case 'tron':
                return this.isValidTron(address);
            case 'btc':
                return this.isValidBitcoin(address);
            default:
                return false;
        }
    }

    private isValidEthereum(address: string): boolean {
        // Starts with 0x followed by 40 hexadecimal characters
        const ethRegex = /^0x[a-fA-F0-9]{40}$/;
        return ethRegex.test(address);
    }

    private isValidTron(address: string): boolean {
        // Starts with 'T' followed by 33 Base58 characters (total 34 characters)
        const tronRegex = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
        return tronRegex.test(address);
    }

    private isValidBitcoin(address: string): boolean {
        // Legacy (1...), Script (3...), Bech32 (bc1...)
        const btcRegex = /^(1|3)[a-km-zA-HJ-NP-Z1-9]{25,34}$|^(bc1)[0-9a-z]{39,59}$/;
        return btcRegex.test(address);
    }
}
