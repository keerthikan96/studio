

// =================================================================
// PERMISSION DEFINITIONS
// =================================================================
// Using a structured format for easier management and UI generation.
// Format: RESOURCE.ACTION

export type Permission = {
    id: string;
    description: string;
    resource: string;
};

const definePermissions = (resource: string, actions: string[], descriptions: { [key: string]: string }): Permission[] => {
    return actions.map(action => ({
        id: `${resource}.${action}`,
        description: descriptions[action],
        resource: resource.split('.')[0] // Top-level resource
    }));
};

const memberPermissions = definePermissions(
    'members',
    ['create', 'read_all', 'read_basic', 'read_sensitive', 'update_basic', 'update_sensitive', 'delete', 'manage_status'],
    {
        create: 'Can create new staff members.',
        read_all: 'Can view the full list of all staff members.',
        read_basic: 'Can view public/basic profile information of any member.',
        read_sensitive: 'Can view sensitive profile information (e.g., salary, personal details).',
        update_basic: 'Can update basic profile information.',
        update_sensitive: 'Can update sensitive profile information.',
        delete: 'Can delete member profiles.',
        manage_status: 'Can activate, deactivate, or put members on hold.'
    }
);

const rolePermissions = definePermissions(
    'roles',
    ['create', 'read', 'update', 'delete', 'assign'],
    {
        create: 'Can create new roles.',
        read: 'Can view roles and their permissions.',
        update: 'Can edit existing roles (name, description, permissions).',
        delete: 'Can delete roles.',
        assign: 'Can assign roles to members.'
    }
);

const leavePermissions = definePermissions(
    'leave',
    ['read_all', 'approve', 'reject', 'manage_categories', 'manage_entitlements'],
    {
        read_all: 'Can view all leave requests from all employees.',
        approve: 'Can approve leave requests.',
        reject: 'Can reject leave requests.',
        manage_categories: 'Can create, edit, and delete leave categories.',
        manage_entitlements: 'Can set and adjust leave entitlements for employees.'
    }
);

const workfeedPermissions = definePermissions(
    'workfeed',
    ['create_post', 'delete_any_post', 'delete_any_comment', 'manage_settings'],
    {
        create_post: 'Can create new posts on the workfeed.',
        delete_any_post: 'Can delete any post on the workfeed.',
        delete_any_comment: 'Can delete any comment on the workfeed.',
        manage_settings: 'Can manage automated workfeed settings (birthdays, anniversaries).'
    }
);

const documentPermissions = definePermissions(
    'documents',
    ['create', 'read', 'update', 'delete'],
    {
        create: 'Can upload documents for members.',
        read: 'Can view all documents for members.',
        update: 'Can edit document details.',
        delete: 'Can delete documents.'
    }
);

const performancePermissions = definePermissions(
    'performance',
    ['create_record', 'read_all', 'read_confidential'],
    {
        create_record: 'Can create performance review records.',
        read_all: 'Can view all non-confidential performance records.',
        read_confidential: 'Can view confidential performance records.'
    }
);

const selfAssessmentPermissions = definePermissions(
    'self_assessment',
    ['read_all', 'finalize'],
    {
        read_all: "Can view all employees' self-assessments.",
        finalize: "Can finalize self-assessments and provide HR feedback."
    }
);


export const PERMISSION_RESOURCES = [
    'members', 'roles', 'leave', 'workfeed', 
    'documents', 'performance', 'self_assessment'
] as const;

export const ALL_PERMISSIONS: Permission[] = [
    ...memberPermissions,
    ...rolePermissions,
    ...leavePermissions,
    ...workfeedPermissions,
    ...documentPermissions,
    ...performancePermissions,
    ...selfAssessmentPermissions,
];
