
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
    tags?: string[];
    pinned?: boolean;
    mentions?: string;
    created_at: Date | string;
};

export type PerformanceRecord = {
    id: string;
    member_id: string;
    reviewer_id: string;
    reviewer_name: string;
    review_date: Date | string;
    score?: number;
    comments?: string;
    tags?: string[];
    attachments?: { name: string, url: string }[];
    is_confidential: boolean;
    pinned: boolean;
    created_at: Date | string;
};

export type AssessmentCategoryComment = {
    category: string;
    comment: string;
};

export type SelfEvaluation = {
    id: string;
    member_id: string;
    evaluation_date: Date | string;
    self_rating?: number;
    comments?: AssessmentCategoryComment[];
    other_comments?: string;
    tags?: string[];
    attachments?: { name: string, url: string }[];
    status: 'Pending' | 'Finalized';
    hr_feedback?: string;
    finalized_by_id?: string;
    finalized_by_name?: string;
    finalized_at?: Date | string;
    created_at: Date | string;
}

export type Document = {
  id: string;
  member_id: string;
  name: string;
  description: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  created_at: Date | string;
};

export type CourseOrCertificate = {
    id: string;
    member_id: string;
    type: 'Course' | 'Certificate';
    name: string;
    provider?: string;
    course_url?: string;
    status?: 'Completed' | 'In Progress';
    verification_url?: string;
    certificate_url?: string;
    certificate_file_type?: string;
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

export type WorkfeedComment = {
    id: string;
    post_id: string;
    parent_comment_id?: string | null;
    author_id: string;
    author_name: string;
    author_avatar_url?: string | null;
    content: string;
    created_at: string;
    likes: string[];
};

export type WorkfeedPost = {
    id: string;
    author_id: string;
    author_name: string;
    author_role?: string;
    author_avatar_url?: string | null;
    content: string;
    image_url?: string | null;
    created_at: string;
    likes: string[];
    comments: WorkfeedComment[];
};

export type AssessmentCategory = {
    id: string;
    name: string;
    created_at: string;
};

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

    