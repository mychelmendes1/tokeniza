export const FILE_TYPES_TO_UPLOAD: Array<string> = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png'
];

export function getFileTypesForHtml(): string {
    return FILE_TYPES_TO_UPLOAD.join(', ');
}