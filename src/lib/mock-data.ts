
export type WorkExperience = {
    companyName: string;
    role: string;
    years: string;
    keyResponsibilities: string;
};

export type Education = {
    institution: string;
    degree: string;
    years: string;
};

export type Note = {
    id: string;
    member_id: string;
    created_by_id: string;
    created_by_name: string;
    note_name: string;
    description: string;
    is_confidential: boolean;
    attachments: { name: string, url: string }[];
    created_at: Date | string;
};

export type Member = {
    id: string;
    name: string;
    email: string;
    domain?: 'Engineering' | 'Design' | 'Marketing' | 'Sales' | 'HR';
    country?: 'Canada' | 'USA' | 'Sri Lanka';
    branch?: string; // Can be a state, province, or a Sri Lankan branch
    status: 'active' | 'pending' | 'inactive';
    phone?: string;
    experience?: WorkExperience[];
    education?: Education[];
    skills?: string[];
    profile_picture_url?: string | null;
    cover_photo_url?: string | null;
    job_title?: string | null;
    date_of_birth?: Date | string | null;
    start_date?: Date | string | null;
    address?: string | null;
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
    created_at?: Date;
    updated_at?: Date;
};
  
// This mock data is now only used as a fallback or for initial setup,
// as the primary data source is the PostgreSQL database.
export const mockMembers: Member[] = [
    { 
        id: 'm_1', 
        name: 'John Doe', 
        email: 'john.doe@example.com', 
        domain: 'Engineering', 
        country: 'USA', 
        branch: 'New York', 
        status: 'active',
        phone: '123-456-7890',
        experience: [{ companyName: 'Tech Solutions', role: 'Sr. Engineer', years: '2019-2023', keyResponsibilities: 'Developed cool stuff.' }],
        education: [{ institution: 'State University', degree: 'B.Sc. CS', years: '2015-2019' }],
        skills: ['React', 'Node.js']
    },
];
