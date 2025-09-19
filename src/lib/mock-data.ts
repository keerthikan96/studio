export type Member = {
    id: string;
    name: string;
    email: string;
    domain: 'Engineering' | 'Design' | 'Marketing' | 'Sales' | 'HR';
    branch: 'New York' | 'London' | 'Tokyo' | 'Sydney';
    status: 'active' | 'pending' | 'inactive';
};
  
export const mockMembers: Member[] = [
    { id: 'm_1', name: 'John Doe', email: 'john.doe@example.com', domain: 'Engineering', branch: 'New York', status: 'active' },
    { id: 'm_2', name: 'Jane Smith', email: 'jane.smith@example.com', domain: 'Design', branch: 'London', status: 'pending' },
    { id: 'm_3', name: 'Sam Wilson', email: 'sam.wilson@example.com', domain: 'Marketing', branch: 'Tokyo', status: 'inactive' },
    { id: 'm_4', name: 'Alice Johnson', email: 'alice.j@example.com', domain: 'Sales', branch: 'Sydney', status: 'active' },
    { id: 'm_5', name: 'Bob Brown', email: 'bob.b@example.com', domain: 'HR', branch: 'New York', status: 'active' },
    { id: 'm_6', name: 'Charlie Davis', email: 'charlie.d@example.com', domain: 'Engineering', branch: 'London', status: 'pending' },
    { id: 'm_7', name: 'Diana Miller', email: 'diana.m@example.com', domain: 'Design', branch: 'Tokyo', status: 'active' },
    { id: 'm_8', name: 'Ethan Garcia', email: 'ethan.g@example.com', domain: 'Marketing', branch: 'Sydney', status: 'inactive' },
    { id: 'm_9', name: 'Fiona Rodriguez', email: 'fiona.r@example.com', domain: 'Sales', branch: 'New York', status: 'pending' },
    { id: 'm_10', name: 'George Martinez', email: 'george.m@example.com', domain: 'HR', branch: 'London', status: 'active' },
    { id: 'm_11', name: 'Hannah Hernandez', email: 'hannah.h@example.com', domain: 'Engineering', branch: 'Tokyo', status: 'active' },
    { id: 'm_12', name: 'Ian Lopez', email: 'ian.l@example.com', domain: 'Design', branch: 'Sydney', status: 'inactive' },
    { id: 'm_13', name: 'Julia Gonzalez', email: 'julia.g@example.com', domain: 'Marketing', branch: 'New York', status: 'active' },
    { id: 'm_14', name: 'Kevin Perez', email: 'kevin.p@example.com', domain: 'Sales', branch: 'London', status: 'pending' },
    { id: 'm_15', name: 'Laura Taylor', email: 'laura.t@example.com', domain: 'HR', branch: 'Tokyo', status: 'active' },
    { id: 'm_16', name: 'Mason Anderson', email: 'mason.a@example.com', domain: 'Engineering', branch: 'Sydney', status: 'inactive' },
    { id: 'm_17', name: 'Nora Thomas', email: 'nora.t@example.com', domain: 'Design', branch: 'New York', status: 'active' },
    { id: 'm_18', name: 'Oscar Jackson', email: 'oscar.j@example.com', domain: 'Marketing', branch: 'London', status: 'pending' },
    { id: 'm_19', name: 'Penelope White', email: 'penelope.w@example.com', domain: 'Sales', branch: 'Tokyo', status: 'active' },
    { id: 'm_20', name: 'Quentin Harris', email: 'quentin.h@example.com', domain: 'HR', branch: 'Sydney', status: 'active' },
];
