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

export type Member = {
    id: string;
    name: string;
    email: string;
    domain: 'Engineering' | 'Design' | 'Marketing' | 'Sales' | 'HR';
    country: 'Canada' | 'USA' | 'Sri Lanka';
    branch: string; // Can be a state, province, or a Sri Lankan branch
    status: 'active' | 'pending' | 'inactive';
    phone?: string;
    experience?: WorkExperience[];
    education?: Education[];
    skills?: string[];
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
    { 
        id: 'm_2', 
        name: 'Jane Smith', 
        email: 'jane.smith@example.com', 
        domain: 'Design', 
        country: 'Canada', 
        branch: 'Ontario', 
        status: 'pending',
        phone: '234-567-8901',
        experience: [{ companyName: 'Creative Co.', role: 'UI/UX Designer', years: '2020-Present', keyResponsibilities: 'Designed beautiful interfaces.' }],
        education: [{ institution: 'Design Institute', degree: 'Graphic Design', years: '2016-2020' }],
        skills: ['Figma', 'Adobe XD']
    },
    { 
        id: 'm_3', 
        name: 'Sam Wilson', 
        email: 'sam.wilson@example.com', 
        domain: 'Marketing', 
        country: 'Sri Lanka', 
        branch: 'Nothern', 
        status: 'inactive',
        phone: '345-678-9012',
        experience: [{ companyName: 'Growth Inc.', role: 'Marketing Lead', years: '2018-2022', keyResponsibilities: 'Managed campaigns.' }],
        education: [{ institution: 'Business School', degree: 'MBA', years: '2016-2018' }],
        skills: ['SEO', 'Content Marketing']
    },
    { id: 'm_4', name: 'Alice Johnson', email: 'alice.j@example.com', domain: 'Sales', country: 'USA', branch: 'California', status: 'active' },
    { id: 'm_5', name: 'Bob Brown', email: 'bob.b@example.com', domain: 'HR', country: 'Canada', branch: 'Quebec', status: 'active' },
    { id: 'm_6', name: 'Charlie Davis', email: 'charlie.d@example.com', domain: 'Engineering', country: 'Sri Lanka', branch: 'Central', status: 'pending' },
    { id: 'm_7', name: 'Diana Miller', email: 'diana.m@example.com', domain: 'Design', country: 'USA', branch: 'Texas', status: 'active' },
    { id: 'm_8', name: 'Ethan Garcia', email: 'ethan.g@example.com', domain: 'Marketing', country: 'Sri Lanka', branch: 'Eastern', status: 'inactive' },
    { id: 'm_9', name: 'Fiona Rodriguez', email: 'fiona.r@example.com', domain: 'Sales', country: 'USA', branch: 'Florida', status: 'pending' },
    { id: 'm_10', name: 'George Martinez', email: 'george.m@example.com', domain: 'HR', country: 'Canada', branch: 'British Columbia', status: 'active' },
    { id: 'm_11', name: 'Hannah Hernandez', email: 'hannah.h@example.com', domain: 'Engineering', country: 'Sri Lanka', branch: 'Nothern', status: 'active' },
    { id: 'm_12', name: 'Ian Lopez', email: 'ian.l@example.com', domain: 'Design', country: 'USA', branch: 'Illinois', status: 'inactive' },
    { id: 'm_13', name: 'Julia Gonzalez', email: 'julia.g@example.com', domain: 'Marketing', country: 'Canada', branch: 'Alberta', status: 'active' },
    { id: 'm_14', name: 'Kevin Perez', email: 'kevin.p@example.com', domain: 'Sales', country: 'Sri Lanka', branch: 'Central', status: 'pending' },
    { id: 'm_15', name: 'Laura Taylor', email: 'laura.t@example.com', domain: 'HR', country: 'USA', branch: 'New York', status: 'active' },
    { id: 'm_16', name: 'Mason Anderson', email: 'mason.a@example.com', domain: 'Engineering', country: 'Canada', branch: 'Manitoba', status: 'inactive' },
    { id: 'm_17', name: 'Nora Thomas', email: 'nora.t@example.com', domain: 'Design', country: 'Sri Lanka', branch: 'Eastern', status: 'active' },
    { id: 'm_18', name: 'Oscar Jackson', email: 'oscar.j@example.com', domain: 'Marketing', country: 'USA', branch: 'Washington', status: 'pending' },
    { id: 'm_19', name: 'Penelope White', email: 'penelope.w@example.com', domain: 'Sales', country: 'Canada', branch: 'Saskatchewan', status: 'active' },
    { id: 'm_20', name: 'Quentin Harris', email: 'quentin.h@example.com', domain: 'HR', country: 'Sri Lanka', branch: 'Nothern', status: 'active' },
];
