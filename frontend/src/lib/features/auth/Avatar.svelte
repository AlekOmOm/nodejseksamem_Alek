<script>
/**
 * Auth management
 * - delete user
 * - delete all data (VMs, Commands, User)
*/

    // ui components
    import * as Avatar from "$lib/components/lib/ui/avatar/index.js";
    import * as DropdownMenu from "$lib/components/lib/ui/dropdown-menu/index.js";
    import { Button } from "$lib/components/lib/ui/button/index.js";

    // features
    import UserDeleteConfirmModal from "./UserDeleteConfirmModal.svelte";

    let open = $state(false);
    let showDeleteUserModal = $state(false);
    let showDeleteAllDataModal = $state(false);

    function handleDeleteUser() {
        open = false;
        showDeleteUserModal = true;
    }

    function handleDeleteAllData() {
        open = false;
        showDeleteAllDataModal = true;
    }

</script>

<div>
    <DropdownMenu.Root bind:open>
        <DropdownMenu.Trigger>
            <Avatar.Root class="w-10 h-10" onclick={() => open = true}>
                <Avatar.Image src="https://github.com/shadcn.png" alt="@shadcn" class="transform scale-x-[-1]" />
                <Avatar.Fallback>CN</Avatar.Fallback>
            </Avatar.Root>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
            <DropdownMenu.Item variant="destructive" onclick={handleDeleteUser}>
                <Button variant="destructive">Delete User</Button>
            </DropdownMenu.Item>
            <DropdownMenu.Item variant="destructive" onclick={handleDeleteAllData}>
                <Button variant="destructive">Delete All Data</Button>
            </DropdownMenu.Item>
        </DropdownMenu.Content>
    </DropdownMenu.Root>
</div>

<UserDeleteConfirmModal 
    isOpen={showDeleteUserModal} 
    deleteType="user"
    onClose={() => showDeleteUserModal = false} 
/>

<UserDeleteConfirmModal 
    isOpen={showDeleteAllDataModal} 
    deleteType="all-data"
    onClose={() => showDeleteAllDataModal = false} 
/>