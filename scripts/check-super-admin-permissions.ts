/**
 * Diagnostic Script: Check Super Admin Permissions Setup
 * 
 * This script verifies:
 * 1. Super Admin role exists
 * 2. All permissions are assigned to Super Admin role
 * 3. Admin user has Super Admin role assigned
 * 4. Admin user can access all permissions
 */

import { db } from '@/lib/db';
import { getUserPermissions } from '@/lib/permission-utils';
import { ALL_PERMISSIONS } from '@/lib/permissions';

async function checkSuperAdminSetup() {
  console.log('\n🔍 Starting Super Admin Permission Diagnostic...\n');
  
  try {
    // 1. Check if Super Admin role exists
    console.log('1️⃣ Checking Super Admin role...');
    const roleResult = await db.query(
      `SELECT id, name, description FROM roles WHERE name = 'Super Admin'`
    );
    
    if (roleResult.rows.length === 0) {
      console.error('❌ Super Admin role NOT found!');
      console.log('   Creating Super Admin role...');
      const createRole = await db.query(
        `INSERT INTO roles (name, description) VALUES ('Super Admin', 'Has all permissions.') RETURNING id`
      );
      console.log('✅ Super Admin role created:', createRole.rows[0].id);
    } else {
      console.log('✅ Super Admin role exists:', roleResult.rows[0]);
    }
    
    const superAdminRoleId = roleResult.rows.length > 0 
      ? roleResult.rows[0].id 
      : (await db.query(`SELECT id FROM roles WHERE name = 'Super Admin'`)).rows[0].id;
    
    // 2. Check permissions assigned to Super Admin
    console.log('\n2️⃣ Checking permissions assigned to Super Admin...');
    const assignedPerms = await db.query(
      `SELECT permission_id FROM role_permissions WHERE role_id = $1`,
      [superAdminRoleId]
    );
    
    console.log(`   Assigned permissions: ${assignedPerms.rows.length}`);
    console.log(`   Total permissions available: ${ALL_PERMISSIONS.length}`);
    
    if (assignedPerms.rows.length < ALL_PERMISSIONS.length) {
      console.log('⚠️  Missing permissions! Assigning all permissions...');
      
      for (const perm of ALL_PERMISSIONS) {
        await db.query(
          `INSERT INTO role_permissions (role_id, permission_id) 
           VALUES ($1, $2) 
           ON CONFLICT (role_id, permission_id) DO NOTHING`,
          [superAdminRoleId, perm.id]
        );
      }
      
      const updatedPerms = await db.query(
        `SELECT permission_id FROM role_permissions WHERE role_id = $1`,
        [superAdminRoleId]
      );
      console.log(`✅ Permissions updated. Now assigned: ${updatedPerms.rows.length}`);
    } else {
      console.log('✅ All permissions are assigned to Super Admin');
    }
    
    // Show all assigned permissions
    const allAssignedPerms = await db.query(
      `SELECT p.id, p.description, p.resource 
       FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = $1
       ORDER BY p.resource, p.id`,
      [superAdminRoleId]
    );
    
    console.log('\n   Permissions by resource:');
    const grouped = allAssignedPerms.rows.reduce((acc: any, perm: any) => {
      if (!acc[perm.resource]) acc[perm.resource] = [];
      acc[perm.resource].push(perm.id);
      return acc;
    }, {});
    
    Object.entries(grouped).forEach(([resource, perms]) => {
      console.log(`   📁 ${resource}: ${(perms as string[]).length} permissions`);
    });
    
    // 3. Check admin user
    console.log('\n3️⃣ Checking admin user...');
    const adminUser = await db.query(
      `SELECT id, name, email FROM members WHERE email = 'admin@gmail.com'`
    );
    
    if (adminUser.rows.length === 0) {
      console.error('❌ Admin user NOT found!');
      console.log('   Creating admin user...');
      const createAdmin = await db.query(`
        INSERT INTO members (
          name, first_name, last_name, email, status, employee_id, 
          job_title, domain, country, branch
        ) VALUES (
          'People and Culture Office', 'People and Culture', 'Office', 
          'admin@gmail.com', 'active', 'ADMIN001', 
          'Administrator', 'HR', 'Canada', 'Head Office'
        ) RETURNING id, email
      `);
      console.log('✅ Admin user created:', createAdmin.rows[0]);
    } else {
      console.log('✅ Admin user exists:', adminUser.rows[0]);
    }
    
    const adminId = adminUser.rows.length > 0 
      ? adminUser.rows[0].id 
      : (await db.query(`SELECT id FROM members WHERE email = 'admin@gmail.com'`)).rows[0].id;
    
    // 4. Check if admin has Super Admin role
    console.log('\n4️⃣ Checking admin role assignment...');
    const adminRoles = await db.query(
      `SELECT r.id, r.name 
       FROM roles r
       INNER JOIN role_members rm ON r.id = rm.role_id
       WHERE rm.member_id = $1`,
      [adminId]
    );
    
    console.log(`   Admin has ${adminRoles.rows.length} role(s):`, adminRoles.rows.map(r => r.name));
    
    const hasSuperAdminRole = adminRoles.rows.some((r: any) => r.name === 'Super Admin');
    
    if (!hasSuperAdminRole) {
      console.log('⚠️  Admin does NOT have Super Admin role! Assigning...');
      await db.query(
        `INSERT INTO role_members (member_id, role_id) 
         VALUES ($1, $2) 
         ON CONFLICT (member_id, role_id) DO NOTHING`,
        [adminId, superAdminRoleId]
      );
      console.log('✅ Super Admin role assigned to admin user');
    } else {
      console.log('✅ Admin has Super Admin role');
    }
    
    // 5. Verify admin permissions
    console.log('\n5️⃣ Verifying admin user permissions...');
    const adminPermissions = await getUserPermissions(adminId);
    
    console.log(`   Admin can access: ${adminPermissions.length} permissions`);
    console.log(`   Expected: ${ALL_PERMISSIONS.length} permissions`);
    
    if (adminPermissions.length < ALL_PERMISSIONS.length) {
      console.error('❌ Admin does NOT have all permissions!');
      console.log('\n   Missing permissions:');
      const missing = ALL_PERMISSIONS.filter(p => !adminPermissions.includes(p.id));
      missing.forEach(p => console.log(`      - ${p.id}`));
    } else {
      console.log('✅ Admin has access to all permissions!');
    }
    
    // 6. Show sample permissions
    console.log('\n6️⃣ Sample admin permissions:');
    adminPermissions.slice(0, 10).forEach(p => console.log(`   ✓ ${p}`));
    if (adminPermissions.length > 10) {
      console.log(`   ... and ${adminPermissions.length - 10} more`);
    }
    
    console.log('\n✅ Diagnostic complete!\n');
    
  } catch (error) {
    console.error('\n❌ Error during diagnostic:', error);
  } finally {
    process.exit(0);
  }
}

// Run the diagnostic
checkSuperAdminSetup();
