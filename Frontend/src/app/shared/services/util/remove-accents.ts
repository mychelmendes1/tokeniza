/**
 * Ignore the accents of 'vowels' and the letters 'n' and 'c' when input validation is required.
 * E.g: input [ÁÀÂÃ], [ÉÈÊ], [ÍÌÎ], [ÓÒÔÕ], [ÚÙÛ], [ç], [ñ].
 * E.g: output [AAAA], [EEE], [III], [OOOO], [UUU], [c], [n].
 * Ignore spaces when input validation is required.
 * E.g: input ' somevalue' or 'somevalue '.
 * E.g: output 'somevalue' or 'somevalue'.
 */

export function removeAccents(text: string): string {
    text = text?.toLowerCase();
    text = text?.replace(new RegExp(/[\xE0-\xE6]/g), 'a');
    text = text?.replace(new RegExp(/[\xE8-\xEB]/g), 'e');
    text = text?.replace(new RegExp(/[\xEC-\xEF]/g), 'i');
    text = text?.replace(new RegExp(/[\xF2-\xF6]/g), 'o');
    text = text?.replace(new RegExp(/[\xF9-\xFC]/g), 'u');
    text = text?.replace(new RegExp(/\xE7/g), 'c');
    text = text?.replace(new RegExp(/\xF1/g), 'n');
    // Ignores spaces at the beginning and end of the word, preserving the spaces in the middle.
    text = text?.replace(new RegExp(/^\s+|\s+$/g), ''); 
    return text;  
}