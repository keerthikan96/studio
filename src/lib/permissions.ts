
import { db } from './db';

// =================================================================
// PERMISSION DEFINITIONS
// =================================================================
// Using a structured format for easier management and UI generation.
// Format: RESOURCE.ACTION

const definePermissions = (resource: string, actions: string[], descriptions: { [key: string]: string }) => {
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

export const ALL_PERMISSIONS = [
    ...memberPermissions,
    ...rolePermissions,
    ...leavePermissions,
    ...workfeedPermissions,
    ...documentPermissions,
    ...performancePermissions,
    ...selfAssessmentPermissions,
];

// =================================================================
// DATABASE & UTILITY FUNCTIONS
// =================================================================

/**
 * Fetches all permissions for a given role ID.
 * @param roleId - The UUID of the role.
 * @returns A promise that resolves to an array of permission strings (e.g., ['members.create', 'members.read_all']).
 */
export async function getRolePermissions(roleId: string): Promise<string[]> {
    try {
        const result = await db.query(
            'SELECT permission_id FROM role_permissions WHERE role_id = $1',
            [roleId]
        );
        return result.rows.map(row => row.permission_id);
    } catch (error) {
        console.error(`Error fetching permissions for role ${roleId}:`, error);
        return [];
    }
}

/**
 * Fetches all permissions for a given member ID by checking their role.
 * @param memberId - The UUID of the member.
 * @returns A promise that resolves to an array of permission strings.
 */
export async function getMemberPermissions(memberId: string): Promise<string[]> {
    try {
        const roleResult = await db.query(
            'SELECT role_id FROM role_members WHERE member_id = $1',
            [memberId]
        );
        if (roleResult.rows.length === 0) {
            return [];
        }
        const roleId = roleResult.rows[0].role_id;
        return getRolePermissions(roleId);
    } catch (error) {
        console.error(`Error fetching role for member ${memberId}:`, error);
        return [];
    }
}

/**
 * Checks if a set of user permissions includes a required permission.
 * @param userPermissions - An array of permissions the user has.
 * @param requiredPermission - The permission string to check for.
 * @returns True if the user has the permission, false otherwise.
 */
export function checkPermission(userPermissions: string[], requiredPermission: string): boolean {
    return userPermissions.includes(requiredPermission);
}
