export interface DiditSessionResponse {
    session_id: string;
    verification_url: string;
    workflow_id?: string;
    status?: string;
    created_at?: string;
    expires_at?: string;
    // Additional properties for session state management
    existingSession?: boolean;
    sessionStatus?: 'pending' | 'approved' | 'rejected' | 'review' | 'in_analysis';
}

export interface DiditSessionRequest {
    email: string;
    fullname: string;
    cpf?: string;
    cnpj?: string;
    passport?: string;
}
